import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { type ConsolaInstance, createConsola } from 'consola';
import { glob } from 'tinyglobby';
import { loadConfig, validateConfig } from './config/config.js';
import type { LunariaConfig, LunariaUserConfig, Pattern } from './config/types.js';
import { FileConfigNotFound } from './errors/errors.js';
import { createPathResolver } from './files/paths.js';
import { LunariaGitInstance } from './status/git.js';
import { getDictionaryCompletion, isFileLocalizable } from './status/status.js';
import type { LunariaStatus, StatusLocalizationEntry } from './status/types.js';

// Additional data to ensure we can force rebuild the cache.
// Bump this whenever there are breaking changes to the status output.
const CACHE_VERSION = '1.0.0';

// Logging levels available for the console.
// Used to translate consola's numeric values into human-readable strings.
export const CONSOLE_LEVELS = {
	error: 0,
	warn: 1,
	info: 3,
	debug: 999,
	silent: -999,
} as const;

interface LunariaOpts {
	logLevel?: keyof typeof CONSOLE_LEVELS;
	force?: boolean;
	config?: LunariaUserConfig;
}

export class Lunaria {
	#config: LunariaConfig;
	#git: LunariaGitInstance;
	#logger: ConsolaInstance;
	// Force a fresh status build, ignoring the cache.
	#force: boolean;
	// Hash built out of the cache version + latest commit hash.
	// If either changed, the status will be rebuilt.
	#cacheHash?: string;

	constructor({ logLevel = 'info', force = false, config }: LunariaOpts = {}) {
		const logger = createConsola({
			level: CONSOLE_LEVELS[logLevel],
		});

		this.#logger = logger;
		this.#force = force;

		try {
			this.#config = config ? validateConfig(config) : loadConfig();
		} catch (e) {
			if (e instanceof Error) this.#logger.error(e.message);
			process.exit(1);
		}

		this.#git = new LunariaGitInstance(this.#config, logger);
	}

	async getFullStatus() {
		/** Uncomment when working in caching
		const latestCommitHash = await this.#git.revparse(['HEAD']);
		// The configuration has to be accounted to invalidate the cache
		// since it can affect the status output.
		const configString = JSON.stringify(this.#config);
		const cacheHash = md5(CACHE_VERSION + latestCommitHash + configString);

		const cachePath = join(this.#config.cacheDir, 'status.json');

		if (existsSync(cachePath) && cacheHash === this.#cacheHash && !this.#force) {
			try {
				const statusJSON = readFileSync(cachePath, {
					encoding: 'utf-8',
				});
				const status = JSON.parse(statusJSON);
				this.#logger.success('Successfully loaded status from cache.');

				return status as LunariaStatus;
			} catch (e) {
				this.#logger.warn('Failed to read status from cache, rebuilding...');
			}
		}
		*/

		const { files } = this.#config;

		const status: LunariaStatus = [];

		// TODO: Check if it might make sense to await Promise.all this as well.
		for (const file of files) {
			const { include, exclude, pattern } = file;

			this.#logger.trace(`Processing files with pattern: ${pattern}`);

			// Paths that were filtered out by not matching the source pattern.
			// We keep track of those to warn the user about them.
			const filteredOutPaths: string[] = [];

			const { isSourcePathMatch } = this.getPathResolver(pattern);
			// Lunaria initially globs only the source files, and then proceed to
			// check the status of each localization file through dynamically
			// generated paths using `pattern`.
			const sourceFilePaths = (
				await glob(include, {
					expandDirectories: false,
					ignore: exclude,
				})
			).filter((path) => {
				if (!isSourcePathMatch(path)) {
					filteredOutPaths.push(path);
					return false;
				}
				return true;
			});

			if (filteredOutPaths.length > 0) {
				this.#logger.warn(
					`The following paths were filtered out by not matching the source pattern: ${filteredOutPaths.map((path) => `\n- ${path}`)}\n\nVerify if your \`files\`'s \`pattern\`, \`include\`, and \`exclude\` are correctly set.`,
				);
			}

			/** We use `Promise.all` to allow the promises to run in parallel, increasing the performance considerably. */
			await Promise.all(
				sourceFilePaths.sort().map(async (path) => {
					const fileStatus = await this.getFileStatus(path);
					if (fileStatus) status.push(fileStatus);
				}),
			);
		}

		return status;
	}

	async getFileStatus(path: string) {
		const fileConfig = this.findFileConfig(path);

		if (!fileConfig) {
			this.#logger.error(FileConfigNotFound.message(path));
			return undefined;
		}

		const { isSourcePathMatch, toPath } = this.getPathResolver(fileConfig.pattern);

		/** The given path can be of another locale, therefore we always convert it to the source path */
		const sourcePath = isSourcePathMatch(path)
			? path
			: toPath(path, this.#config.sourceLocale.lang);

		const isLocalizable = isFileLocalizable(path, this.#config.tracking.localizableProperty);

		if (isLocalizable instanceof Error) {
			this.#logger.error(isLocalizable.message);
			return undefined;
		}

		const latestSourceChanges = await this.#git.getFileLatestChanges(sourcePath);

		return {
			...fileConfig,
			source: {
				lang: this.#config.sourceLocale.lang,
				path: sourcePath,
				git: latestSourceChanges,
			},
			localizations: await Promise.all(
				this.#config.locales.map(async ({ lang }): Promise<StatusLocalizationEntry> => {
					const localizedPath = toPath(path, lang);

					if (!existsSync(resolve(localizedPath))) {
						return {
							lang: lang,
							path: localizedPath,
							status: 'missing',
						};
					}

					const latestLocaleChanges = await this.#git.getFileLatestChanges(localizedPath);

					/**
					 * Outdatedness is defined when the latest tracked (that is, considered by Lunaria)
					 * change in the source file is newer than the latest tracked change in the localized file.
					 */
					const isOutdated =
						new Date(latestSourceChanges.latestTrackedChange.date) >
						new Date(latestLocaleChanges.latestTrackedChange.date);

					const entryTypeData = () => {
						if (fileConfig.type === 'dictionary') {
							try {
								const missingKeys = getDictionaryCompletion(
									fileConfig.optionalKeys,
									sourcePath,
									localizedPath,
								);

								return {
									missingKeys,
								};
							} catch (e) {
								if (e instanceof Error) {
									this.#logger.error(e.message);
								}
								process.exit(1);
							}
						}
						return {};
					};

					return {
						lang: lang,
						path: localizedPath,
						git: latestLocaleChanges,
						status: isOutdated ? 'outdated' : 'up-to-date',
						...entryTypeData(),
					};
				}),
			),
		};
	}

	/** Returns a path resolver for the specified pattern. */
	getPathResolver(pattern: Pattern) {
		return createPathResolver(pattern, this.#config.sourceLocale, this.#config.locales);
	}

	/** Finds the matching `files` configuration for the specified path. */
	findFileConfig(path: string) {
		return this.#config.files.find((file) => {
			// TODO: We should update this since the pattern might match, but not the include that determines a different type for it.
			const { isSourcePathMatch, isLocalesPathMatch } = this.getPathResolver(file.pattern);
			// We're checking if the path matches either the source or locales pattern,
			// that way we can determine the `files` entry that should be used for the path.
			return isSourcePathMatch(path) || isLocalesPathMatch(path);
		});
	}
}
