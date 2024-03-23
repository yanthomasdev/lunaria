import glob from 'fast-glob';
import micromatch from 'micromatch';
import { join, resolve } from 'node:path';
import { compile, match, type MatchResult } from 'path-to-regexp';
import type { DefaultLogFields, ListLogLine } from 'simple-git';
import { code, error, highlight } from '../cli/console.js';
import type { Locale, LunariaConfig } from '../config/index.js';
import type {
	FileData,
	FileIndex,
	IndexEntry,
	LocalizationStatus,
	RegExpGroups,
	SourceFileMeta,
} from '../types.js';
import { getStringFromFormat, toUtcString } from '../utils.js';
import { getDictionaryCompletion } from './dictionaries.js';
import { frontmatterFile, getFileFrontmatter } from './frontmatter.js';
import { getFileHistory, getGitHostingLinks } from './git.js';

export * from './schemas.js';

export async function getLocalizationStatus(config: LunariaConfig, isShallowRepo: boolean) {
	const { defaultLocale, locales, repository } = config;

	const contentIndex = await getFileIndex(config, isShallowRepo);
	const sourceLocaleIndex = contentIndex[defaultLocale.lang];

	if (!sourceLocaleIndex) {
		console.error(
			error(
				'Failed to find the index for the default locale. See if you correctly globbed your content files.'
			)
		);
		process.exit(1);
	}

	const gitHostingLinks = getGitHostingLinks(repository);
	const localizationStatus: LocalizationStatus[] = [];

	for (const sharedPath of Object.keys(sourceLocaleIndex)) {
		const sourceFile = sourceLocaleIndex[sharedPath];
		if (!sourceFile || !sourceFile.isLocalizable) continue;

		const localizations: LocalizationStatus['localizations'] = {};

		const fileStatus: LocalizationStatus = {
			sharedPath,
			sourceFile,
			localizations,
		};

		for (const { lang } of locales) {
			const pathResolver = getPathResolver(sourceFile.pattern, defaultLocale, locales);
			const localizationFile = contentIndex[lang]?.[sharedPath];
			const localeFilePath = pathResolver.toLocalePath(sourceFile.path, lang);

			switch (localizationFile?.meta.type) {
				case undefined: {
					localizations[lang] = {
						isMissing: true,
						gitHostingFileURL: gitHostingLinks.create(localeFilePath),
						gitHostingHistoryURL: gitHostingLinks.history(
							sourceFile.path,
							sourceFile.git.lastMajorChange
						),
					};
					break;
				}

				case 'universal': {
					localizations[lang] = {
						...localizationFile,
						isMissing: false,
						isOutdated: sourceFile.git.lastMajorChange > localizationFile.git.lastMajorChange,
						gitHostingHistoryURL: gitHostingLinks.history(
							sourceFile.path,
							sourceFile.git.lastMajorChange
						),
						meta: {
							type: 'universal',
						},
					};
					break;
				}

				case 'dictionary': {
					localizations[lang] = {
						...localizationFile,
						isMissing: false,
						isOutdated: sourceFile.git.lastMajorChange > localizationFile.git.lastMajorChange,
						gitHostingHistoryURL: gitHostingLinks.history(
							sourceFile.path,
							sourceFile.git.lastMajorChange
						),
						meta: {
							type: 'dictionary',
							missingKeys: await getDictionaryCompletion(
								sourceFile.meta.type === 'dictionary' ? sourceFile.meta.optionalKeys : undefined,
								localizationFile.path,
								sourceFile.path,
								sharedPath
							),
						},
					};
				}
			}
		}
		localizationStatus.push(fileStatus);
	}

	return localizationStatus;
}

async function getFileIndex(config: LunariaConfig, isShallowRepo: boolean) {
	const { files, defaultLocale, locales, localizableProperty, ignoreKeywords, repository } = config;

	const contentIndex: FileIndex = {};
	for (const file of files) {
		const { location, ignore, pattern } = file;

		const pathResolver = getPathResolver(pattern, defaultLocale, locales);

		const contentPaths = await glob(location, {
			cwd: process.cwd(),
			ignore: ['node_modules', ...ignore],
		});

		const filesData = await Promise.all(
			contentPaths.sort().map(async (path): Promise<IndexEntry> => {
				const params = pathResolver.isMatch(path).params;

				if (!params) {
					console.error(
						error(
							`Failed to extract path params from pattern ${highlight(pattern)}. Is there a typo?`
						)
					);
					process.exit(1);
				}

				const lang = params.lang || defaultLocale.lang;
				const isSourceLocale = lang === defaultLocale.lang;
				const sharedPath = pathResolver.toSharedPath(path);

				const gitHostingLinks = getGitHostingLinks(repository);
				const gitHostingFileURL = gitHostingLinks.source(path);
				const gitHostingHistoryURL = gitHostingLinks.history(path);

				const fileData = await getFileData(
					path,
					isSourceLocale,
					isShallowRepo,
					repository.rootDir,
					localizableProperty,
					ignoreKeywords
				);

				const meta: SourceFileMeta = {
					type: file.type,
					...(file.type === 'dictionary' && { optionalKeys: file.optionalKeys }),
				};

				return {
					lang,
					sharedPath,
					...fileData,
					gitHostingFileURL,
					gitHostingHistoryURL,
					pattern,
					meta,
				};
			})
		);

		filesData.forEach((data) => {
			const { lang, sharedPath } = data;
			contentIndex[lang] = {
				...contentIndex[lang],
				[sharedPath]: data,
			};
		});
	}

	return contentIndex;
}

async function getFileData(
	filePath: string,
	isSourceLocale: boolean,
	isShallowRepo: boolean,
	rootDir: string,
	localizableProperty: string | undefined,
	ignoreKeywords: string[]
): Promise<FileData> {
	/** On shallow monorepos the entire repository is cloned,
	 * which means we have to consider the project's root
	 * directory to avoid errors while searching the git history.
	 */
	const monorepoSafePath = isShallowRepo ? join(rootDir, filePath) : filePath;
	const historyData = await getFileHistory(monorepoSafePath);

	const allCommits = historyData.all;
	const lastCommit = historyData.latest;

	if (!lastCommit || !allCommits) {
		console.error(
			error(
				`Failed to retrieve last commit data from ${resolve(
					monorepoSafePath
				)}. Your working copy should not contain uncommitted changes to tracked files when running Lunaria. This might also happen when developing locally on a monorepo without the ${code(
					'repository.rootDir'
				)} option set.`
			)
		);
		process.exit(1);
	}

	const lastMajorCommit = findLastMajorCommit(filePath, allCommits, ignoreKeywords) || lastCommit;

	return {
		path: filePath,
		isLocalizable: await isLocalizable(filePath, localizableProperty, isSourceLocale),
		git: {
			lastChange: toUtcString(lastCommit.date),
			lastCommitMessage: lastCommit.message,
			lastCommitHash: lastCommit.hash,
			lastMajorChange: toUtcString(lastMajorCommit.date),
			lastMajorCommitMessage: lastMajorCommit.message,
			lastMajorCommitHash: lastMajorCommit.hash,
		},
	};
}

export function getPathResolver(pattern: string, defaultLocale: Locale, locales: Locale[]) {
	const langs = [defaultLocale, ...locales].map(({ lang }) => lang);

	const localesPartial = langs.join('|');
	const langPattern = `:lang(${localesPartial})?`;
	const langPatternDir = `{:lang(${localesPartial})/}?`;
	const pathPattern = ':path(.*)';
	const augmentedPattern = getStringFromFormat(pattern, {
		'@locales': localesPartial,
		'@lang/': langPatternDir,
		'@lang': langPattern,
		'@path': pathPattern,
	});

	const matcher = match(augmentedPattern) as (
		path: string
	) => MatchResult<{ lang?: string; path: string }>;
	const toPath = compile<{ lang?: string; path: string }>(augmentedPattern);

	const getParams = (path: string) => {
		return matcher(path).params;
	};

	return {
		isMatch: matcher,
		toLocalePath: (path: string, lang: string) => {
			return toPath({
				path: getParams(path).path,
				lang,
			});
		},
		toSharedPath: (path: string) => {
			return toPath({
				path: getParams(path).path,
			});
		},
	};
}

function findLastMajorCommit(
	filePath: string,
	allCommits: readonly (DefaultLogFields & ListLogLine)[],
	ignoreKeywords: string[]
) {
	// TODO: See how to document the fact monorepos paths will be based on
	// the root of the project, not the root of the monorepo.

	/** Regex that matches a `'@lunaria-track'` or `'@lunaria-ignore'` group
	 * and a sequence of characters till line break. Inteded for user-specified
	 * file paths or globs, separated by a semicolon.
	 *
	 * This means whenever a valid tracker directive is found, the tracking system
	 * is taken over by the user and all the files listed will suffer status changes
	 * or be ignored, while the non-specified files will go through the inverse.
	 */

	// TODO: Remove `@tracker-major` and `@tracker-minor` in v1.0
	const TRACKER_DIRECTIVES =
		/(?<directive>@tracker-major|@lunaria-track|@tracker-minor|@lunaria-ignore):(?<pathsOrGlobs>[^\n]+)?/;
	/** Dynamic regex that matches any occurances of the user-specified keywords (case-insensitive)
	 * @example
	 * Given the array `['one', 'two', 'three']`, you get
	 * the following final regex: `/(one|two|three)/i`
	 * */
	const IGNORE_KEYWORDS = new RegExp(`(${ignoreKeywords.join('|')})`, 'i');

	return allCommits.find((entry) => {
		if (entry.message.match(IGNORE_KEYWORDS)) return false;

		const trackerDirectiveMatch: RegExpGroups<'directive' | 'pathsOrGlobs'> =
			entry.body.match(TRACKER_DIRECTIVES);

		if (!trackerDirectiveMatch || !trackerDirectiveMatch.groups) return true;

		const { directive, pathsOrGlobs } = trackerDirectiveMatch.groups;

		const pathsOrGlobsList = pathsOrGlobs.split(';');

		return (
			pathsOrGlobsList.find((pathOrGlob) => {
				// @tracker-(major/minor) are kept for
				if (directive === '@lunaria-track' || directive === '@tracker-major')
					return micromatch.isMatch(filePath, pathOrGlob);
				if (directive === '@lunaria-ignore' || directive === '@tracker-minor')
					return !micromatch.isMatch(filePath, pathOrGlob);
			}) !== undefined
		);
	});
}

async function isLocalizable(
	filePath: string,
	localizableProperty: string | undefined,
	isSourceLocale: boolean
) {
	/**
	 * If it's not a source locale, there is no localizableProperty defined in the config,
	 * or the file format doesn't include frontmatter, the file is marked as localizable
	 * by default.
	 */
	if (!isSourceLocale || !localizableProperty) return true;
	if (!frontmatterFile.test(filePath)) return true;

	const frontmatter = getFileFrontmatter(filePath);
	const isLocalizable = frontmatter?.[localizableProperty];

	/** Mark as not localizable if the property wasn't found in a specific file. */
	if (typeof isLocalizable === 'undefined') return false;

	if (typeof isLocalizable !== 'boolean') {
		console.error(
			error(
				`The specified frontmatter property ${localizableProperty} was found with an non-boolean value in ${filePath}. Ensure that all of its occurances are either as \`true\` or \`false\`.`
			)
		);
		process.exit(1);
	}

	return isLocalizable;
}
