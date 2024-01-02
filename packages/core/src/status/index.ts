import glob from 'fast-glob';
import micromatch from 'micromatch';
import { join, resolve } from 'node:path';
import { compile, match, type MatchResult } from 'path-to-regexp';
import type { DefaultLogFields, ListLogLine } from 'simple-git';
import { code, error, highlight } from '../cli/messages.js';
import type {
	ContentIndex,
	FileData,
	FileMeta,
	IndexData,
	Locale,
	LocalizationStatus,
	LunariaConfig,
	RegExpGroups,
} from '../types.js';
import { getStringFromFormat, toUtcString } from '../utils.js';
import { getDictionaryCompletion } from './dictionaries.js';
import { frontmatterFile, getFileFrontmatter } from './frontmatter.js';
import { getFileHistory, getGitHostingLinks } from './git.js';

export async function getLocalizationStatus(config: LunariaConfig, isShallowRepo: boolean) {
	const { defaultLocale, locales, repository } = config;

	const contentIndex = await getContentIndex(config, isShallowRepo);
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
			gitHostingFileURL: gitHostingLinks.source(sourceFile.filePath),
			localizations,
		};

		for (const { lang } of locales) {
			const localizationFile = contentIndex[lang]?.[sharedPath];
			const localeFilePath = sourceFile.pathResolver.toLocalePath(sourceFile.filePath, lang);

			const fileSourceURL = localizationFile
				? gitHostingLinks.source(localizationFile.filePath)
				: gitHostingLinks.create(localeFilePath);

			localizations[lang] = {
				file: localizationFile,
				completeness: await getDictionaryCompletion(
					sourceFile.type === 'dictionary' ? sourceFile.optionalKeys : undefined,
					localizationFile,
					sourceFile.filePath,
					sharedPath
				),
				isMissing: !localizationFile,
				isOutdated:
					(localizationFile && sourceFile.lastMajorChange > localizationFile.lastMajorChange) ??
					false,
				gitHostingFileURL: fileSourceURL,
				gitHostingHistoryURL: gitHostingLinks.history(
					sourceFile.filePath,
					localizationFile?.lastMajorChange ?? ''
				),
			};
		}
		localizationStatus.push(fileStatus);
	}

	return localizationStatus;
}

async function getContentIndex(config: LunariaConfig, isShallowRepo: boolean) {
	const { files, defaultLocale, locales, localizableProperty, ignoreKeywords, repository } = config;

	const contentIndex: ContentIndex = {};
	for (const file of files) {
		const { location, ignore, pattern } = file;

		const pathResolver = getPathResolver(pattern, defaultLocale, locales);

		const contentPaths = await glob(location, {
			cwd: process.cwd(),
			ignore: ['node_modules', ...ignore],
		});

		const filesData = await Promise.all(
			contentPaths.sort().map(async (path): Promise<IndexData> => {
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
				const sharedPath = pathResolver.toSharedPath(path);

				const fileData = await getFileData(
					path,
					isShallowRepo,
					repository.rootDir,
					localizableProperty,
					ignoreKeywords
				);

				const meta: FileMeta = {
					pathResolver: pathResolver,
					type: file.type,
					...(file.type === 'dictionary' && { optionalKeys: file.optionalKeys }),
				};

				return {
					lang,
					sharedPath,
					fileData,
					meta,
				};
			})
		);

		filesData.forEach(({ lang, sharedPath, fileData, meta }) => {
			contentIndex[lang] = {
				...contentIndex[lang],
				[sharedPath]: {
					...fileData,
					...meta,
				},
			};
		});
	}

	return contentIndex;
}

async function getFileData(
	filePath: string,
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

	// TODO: Optimize to only go after localizableProperty of source files.
	return {
		filePath: filePath,
		isLocalizable: await isLocalizable(filePath, localizableProperty),
		lastChange: toUtcString(lastCommit.date),
		lastCommitMessage: lastCommit.message,
		lastMajorChange: toUtcString(lastMajorCommit.date),
		lastMajorCommitMessage: lastMajorCommit.message,
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

	/** Regex that matches a `'@tracker-major'` or `'@tracker-minor'` group
	 * and a sequence of characters till line break. Inteded for user-specified
	 * file paths or globs, separated by a semicolon.
	 *
	 * This means whenever a valid tracker directive is found, the tracking system
	 * is taken over by the user and all the files/patterns listed will get that
	 * state (e.g. major change), while the others will get the inverse (e.g. minor change).
	 */
	const TRACKER_DIRECTIVES = /(?<directive>@tracker-major|@tracker-minor):(?<pathsOrGlobs>[^\n]+)?/;
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
				if (directive === '@tracker-major') return micromatch.isMatch(filePath, pathOrGlob);
				if (directive === '@tracker-minor') return !micromatch.isMatch(filePath, pathOrGlob);
			}) !== undefined
		);
	});
}

async function isLocalizable(filePath: string, localizableProperty: string | undefined) {
	/** If no localizableProperty is defined in the configuration, or
	 * the file format doesn't include frontmatter, the file is marked
	 * as localizable by default.
	 */
	if (!localizableProperty || !frontmatterFile.test(filePath)) return true;

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
