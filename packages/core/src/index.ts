import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { type ConsolaInstance, createConsola } from 'consola';
import picomatch from 'picomatch';
import { glob } from 'tinyglobby';
import { loadConfig, validateConfig } from './config/config.js';
import type { LunariaConfig, LunariaUserConfig, Pattern } from './config/types.js';
import { FileConfigNotFound } from './errors/errors.js';
import { createPathResolver } from './files/paths.js';
import { useCache } from './status/cache.js';
import { LunariaGitInstance } from './status/git.js';
import { getDictionaryCompletion, isFileLocalizable } from './status/status.js';
import type { LunariaStatus, StatusLocalizationEntry } from './status/types.js';
import { Cache, md5 } from './utils/utils.js';

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
	#force: boolean;
	#hash: string;

	constructor({ logLevel = 'info', force = false, config }: LunariaOpts = {}) {
		this.#logger = createConsola({
			level: CONSOLE_LEVELS[logLevel],
		});
		this.#force = force;

		try {
			this.#config = config ? validateConfig(config) : loadConfig();
		} catch (e) {
			if (e instanceof Error) this.#logger.error(e.message);
			process.exit(1);
		}

		// Hash used to revalidate the cache -- the tracking properties manipulate how the changes are tracked,
		// therefore we have to account for them so that the cache is fresh.
		this.#hash = md5(
			`ignoredKeywords::${this.#config.tracking.ignoredKeywords.join('|')}:localizableProperty::${this.#config.tracking.localizableProperty}`,
		);

		this.#git = new LunariaGitInstance(this.#config, this.#logger, this.#force, this.#hash);
	}

	async getFullStatus() {
		const { files } = this.#config;

		const status: LunariaStatus = [];

		// TODO: Check if it might make sense to await Promise.all this as well.
		for (const file of files) {
			const { include, exclude, pattern } = file;

			this.#logger.trace(`Processing files with pattern: ${pattern}`);

			// Paths that were filtered out by not matching the source pattern.
			// We keep track of those to warn the user about them.
			const filteredOutPaths: string[] = [];

			const { isSourcePath } = this.getPathResolver(pattern);
			// Lunaria initially globs only the source files, and then proceed to
			// check the status of each localization file through dynamically
			// generated paths using `pattern`.
			const sourceFilePaths = (
				await glob(include, {
					expandDirectories: false,
					ignore: exclude,
				})
			).filter((path) => {
				if (!isSourcePath(path)) {
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
					const fileStatus = await this.#getFileStatus(path, false);
					if (fileStatus) status.push(fileStatus);
				}),
			);
		}

		// Save the existing git data into the cache for next builds.
		if (!this.#force) {
			new Cache(this.#config.cacheDir, 'git', this.#hash).write(this.#git.cache);
		}

		return status;
	}

	// The existence of both a public and private `getFileStatus()` is to hide
	// the cache parameter from the public API. We do that so when we invoke
	// it from `getFullStatus()` we only write to the cache once, considerably
	// increasing performance (1 cache write instead of one for each file).
	// Otherwise, when users invoke this method, they will also want to enjoy
	// caching normally, unless they explicitly want to force a fresh status.
	async getFileStatus(path: string) {
		return this.#getFileStatus(path, !this.#force);
	}

	async #getFileStatus(path: string, cache: boolean) {
		const fileConfig = this.findFileConfig(path);

		if (!fileConfig) {
			this.#logger.error(FileConfigNotFound.message(path));
			return undefined;
		}

		const { isSourcePath, toPath } = this.getPathResolver(fileConfig.pattern);

		/** The given path can be of another locale, therefore we always convert it to the source path */
		const sourcePath = isSourcePath(path) ? path : toPath(path, this.#config.sourceLocale.lang);

		const isLocalizable = isFileLocalizable(path, this.#config.tracking.localizableProperty);

		if (isLocalizable instanceof Error) {
			this.#logger.error(isLocalizable.message);
			return undefined;
		}

		const latestSourceChanges = await this.#git.getFileLatestChanges(sourcePath);

		// Save the existing git data into the cache for next builds.
		if (cache) {
			new Cache(this.#config.cacheDir, 'git', this.#hash).write(this.#git.cache);
		}

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
			const { isSourcePath, toPath } = this.getPathResolver(file.pattern);

			try {
				const sourcePath = isSourcePath(path) ? path : toPath(path, this.#config.sourceLocale.lang);

				// There's a few cases in which the pattern might match, but the include/exclude filters don't,
				// therefore we need to test both to find the correct `files` config.
				return (
					isSourcePath(path) &&
					picomatch.isMatch(sourcePath, file.include, {
						ignore: file.exclude,
					})
				);
				// If it fails to match, we assume it's not the respective `files` config and return false.
			} catch {
				return false;
			}
		});
	}
}
