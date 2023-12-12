import destr from 'destr';
import glob from 'fast-glob';
import micromatch from 'micromatch';
import { readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { rehype } from 'rehype';
import rehypeFormat from 'rehype-format';
import type { DefaultLogFields, ListLogLine } from 'simple-git';
import { joinURL } from 'ufo';
import { frontmatterFileExtensions, moduleFileExtensions } from './constants.js';
import { Page } from './dashboard/components.js';
import { DictionaryContentSchema } from './schemas/misc.js';
import type {
	AugmentedFileData,
	DictionaryObject,
	FileContentIndex,
	FileData,
	FileTranslationStatus,
	IndexData,
	LunariaConfig,
	LunariaRendererConfig,
	OptionalKeys,
	RegExpGroups,
} from './types.js';
import { getPageHistory } from './utils/git.js';
import {
	getFrontmatterFromFile,
	getFrontmatterProperty,
	getTextFromFormat,
	loadFile,
	renderToString,
	toUtcString,
} from './utils/misc.js';

export async function getTranslationStatus(
	opts: LunariaConfig,
	fileContentIndex: FileContentIndex
) {
	const { defaultLocale, locales, repository, routingStrategy } = opts;

	const sourceLocaleIndex = fileContentIndex[defaultLocale.lang];
	const translationStatus: FileTranslationStatus[] = [];

	const allLangs = [defaultLocale, ...locales].map((locale) => locale.lang);
	const gitHostingLinks = getGitHostingLinks(repository);

	if (!sourceLocaleIndex) {
		console.error(
			new Error(
				'Failed to find the index for the default locale. See if you correctly globbed your content files.'
			)
		);
		process.exit(1);
	}

	await Promise.all(
		Object.keys(sourceLocaleIndex).map(async (sharedPath) => {
			const sourceFile = sourceLocaleIndex[sharedPath];
			if (!sourceFile || !sourceFile.isTranslatable) return;

			const fileStatus: FileTranslationStatus = {
				sharedPath,
				sourcePage: sourceFile,
				gitHostingFileURL: gitHostingLinks.source(sourceFile.filePath),
				translations: {},
			};

			await Promise.all(
				locales.map(async ({ lang }) => {
					const translationFile = fileContentIndex[lang]?.[sharedPath];

					const localeFilePath = getPathResolver(routingStrategy, allLangs).toLocalePath(
						sourceFile.filePath,
						lang
					);

					const fileSourceURL = translationFile
						? gitHostingLinks.source(translationFile.filePath)
						: gitHostingLinks.create(localeFilePath);

					fileStatus.translations[lang] = {
						file: translationFile,
						completeness: await getDictionaryTranslationStatus(
							defaultLocale.dictionaries?.optionalKeys,
							translationFile,
							sourceFile.filePath,
							sharedPath
						),
						isMissing: !translationFile,
						isOutdated:
							(translationFile && sourceFile.lastMajorChange > translationFile.lastMajorChange) ??
							false,
						gitHostingFileURL: fileSourceURL,
						gitHostingHistoryURL: gitHostingLinks.history(
							sourceFile.filePath,
							translationFile?.lastMajorChange ?? ''
						),
					};
				})
			);

			translationStatus.push(fileStatus);
		})
	);
	return translationStatus;
}

export async function getContentIndex(opts: LunariaConfig, isShallowRepo: boolean) {
	const {
		translatableProperty,
		defaultLocale,
		locales,
		ignoreKeywords,
		routingStrategy,
		repository,
	} = opts;

	const allLocales = [defaultLocale, ...locales];
	const allLangs = allLocales.map((locale) => locale.lang);

	const fileContentIndex: FileContentIndex = {};
	const pathResolver = getPathResolver(routingStrategy, allLangs);

	for (const { lang, content, dictionaries } of allLocales) {
		const genericContentIndex = [];
		if (content) {
			const { location, ignore } = content;

			const localeContentPaths = await glob(location, {
				cwd: process.cwd(),
				ignore: ['node_modules', ...ignore],
			});

			genericContentIndex.push(
				...(await Promise.all(
					localeContentPaths.sort().map(async (filePath) => {
						const sharedPath = pathResolver.toSharedPath(filePath);

						return {
							lang,
							filePath,
							sharedPath,
							fileData: await getFileData(
								filePath,
								isShallowRepo,
								repository.rootDir,
								translatableProperty,
								ignoreKeywords
							),
							meta: {
								type: 'generic',
							},
						} as IndexData;
					})
				))
			);
		}

		const dictionaryContentIndex = [];
		if (dictionaries) {
			const { location, ignore, optionalKeys } = dictionaries;

			const localeDictionariesPaths = await glob(location, {
				cwd: process.cwd(),
				ignore: ['node_modules', ...ignore],
			});

			dictionaryContentIndex.push(
				...(await Promise.all(
					localeDictionariesPaths.sort().map(async (filePath) => {
						const sharedPath = pathResolver.toSharedPath(filePath);
						// Create or update page data for the page
						return {
							lang,
							filePath,
							sharedPath,
							fileData: await getFileData(
								filePath,
								isShallowRepo,
								repository.rootDir,
								translatableProperty,
								ignoreKeywords
							),
							meta: {
								type: 'dictionary',
								optionalKeys: optionalKeys,
							},
						} as IndexData;
					})
				))
			);
		}

		[...dictionaryContentIndex, ...genericContentIndex].forEach(
			({ lang, sharedPath, fileData, meta }) => {
				fileContentIndex[lang] = {
					...fileContentIndex[lang],
					[sharedPath]: {
						...fileData,
						...meta,
					},
				};
			}
		);
	}

	return fileContentIndex;
}

export async function generateDashboardHtml(
	opts: LunariaConfig,
	rendererOpts: LunariaRendererConfig,
	translationStatus: FileTranslationStatus[]
) {
	const html = await rehype()
		.use(rehypeFormat)
		.process(renderToString(Page(opts, rendererOpts, translationStatus)));
	return String(html);
}

async function getFileData(
	filePath: string,
	isShallowRepo: boolean,
	rootDir: string,
	translatableProperty: string | undefined,
	ignoreKeywords: string[]
): Promise<FileData> {
	/** On shallow monorepos the entire repository is cloned,
	 * which means we have to consider the project's root
	 * directory to avoid errors while searching the git history.
	 */
	const monorepoSafePath = isShallowRepo ? join(rootDir, filePath) : filePath;
	const historyData = await getPageHistory(monorepoSafePath);

	const allCommits = historyData.all;
	const lastCommit = historyData.latest;

	if (!lastCommit || !allCommits) {
		console.error(
			new Error(
				`Failed to retrive last commit data from ${resolve(
					monorepoSafePath
				)}. Your working copy should not contain uncommitted new pages when running this script. This might also happen when developing locally on a monorepo without the \`repository.rootDir\` option set.`
			)
		);
		process.exit(1);
	}

	const lastMajorCommit = findLastMajorCommit(filePath, allCommits, ignoreKeywords) || lastCommit;

	// TODO: Optimize to only go after translatableProperty of source pages.
	return {
		filePath: filePath,
		isTranslatable: isTranslatable(filePath, translatableProperty),
		lastChange: toUtcString(lastCommit.date),
		lastCommitMessage: lastCommit.message,
		lastMajorChange: toUtcString(lastMajorCommit.date),
		lastMajorCommitMessage: lastMajorCommit.message,
	};
}

export function getGitHostingLinks(repository: LunariaConfig['repository']) {
	const { name, branch, hosting, rootDir } = repository;

	if (hosting === 'github')
		return {
			create: (filePath: string) =>
				`https://github.com/${name}/new/${branch}?filename=${joinURL(rootDir, filePath)}`,
			source: (filePath: string) =>
				`https://github.com/${name}/blob/${branch}/${joinURL(rootDir, filePath)}`,
			history: (filePath: string, sinceDate: string) =>
				`https://github.com/${name}/commits/${branch}/${joinURL(
					rootDir,
					filePath
				)}?since=${sinceDate}`,
			clone: () => `https://github.com/${name}.git`,
		};

	if (hosting === 'gitlab')
		return {
			create: (filePath: string) =>
				`https://gitlab.com/${name}/-/new/${branch}?file_name=${joinURL(rootDir, filePath)}`,
			source: (filePath: string) =>
				`https://gitlab.com/${name}/-/blob/${branch}/${joinURL(rootDir, filePath)}`,
			history: (filePath: string, sinceDate: string) =>
				`https://gitlab.com/${name}/-/commits/${branch}/${joinURL(
					rootDir,
					filePath
				)}?since=${sinceDate}`,
			clone: () => `https://gitlab.com/${name}.git`,
		};

	return {
		create: (filePath: string) =>
			hosting.create
				? getTextFromFormat(hosting.create, {
						':name': name,
						':branch': branch,
						':path': joinURL(rootDir, filePath),
				  })
				: null,
		source: (filePath: string) =>
			hosting.source
				? getTextFromFormat(hosting.source, {
						':name': name,
						':branch': branch,
						':path': joinURL(rootDir, filePath),
				  })
				: null,
		history: (filePath: string, sinceDate: string) =>
			hosting.history
				? getTextFromFormat(hosting.history, {
						':name': name,
						':branch': branch,
						':path': joinURL(rootDir, filePath),
						':since': sinceDate,
				  })
				: null,
		clone: () =>
			getTextFromFormat(hosting.clone, {
				':name': name,
			}),
	};
}

export function getPathResolver(
	routingStrategy: LunariaConfig['routingStrategy'],
	allLangs: string[]
) {
	const localesRegexPartial = allLangs.join('|');

	if (routingStrategy === 'directory') {
		const directoryRegExp = new RegExp(
			getTextFromFormat('(:locales)/', {
				':locales': localesRegexPartial,
			})
		);

		return {
			toLocalePath: (path: string, lang: string) => path.replace(directoryRegExp, `${lang}/`),
			toSharedPath: (path: string) => path.replace(directoryRegExp, ''),
		};
	}

	/** TODO: Test this with Nextra to see if it's 100% compatible. */
	if (routingStrategy === 'file') {
		const fileRegExp = new RegExp(
			getTextFromFormat('.(:locales).', {
				':locale': localesRegexPartial,
			})
		);

		return {
			toLocalePath: (path: string, lang: string) => path.replace(fileRegExp, `.${lang}.`),
			toSharedPath: (path: string) => path.replace(fileRegExp, '.'),
		};
	}

	const { regex, sharedPathReplaceWith, localePathReplaceWith } = routingStrategy;

	const customRoutingRegExp = new RegExp(
		getTextFromFormat(regex, {
			':locales': localesRegexPartial,
		})
	);

	return {
		toLocalePath: (path: string, lang: string) =>
			path.replace(
				customRoutingRegExp,
				getTextFromFormat(localePathReplaceWith, {
					':locale': lang,
				})
			),
		toSharedPath: (path: string) => path.replace(customRoutingRegExp, sharedPathReplaceWith),
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

function isTranslatable(filePath: string, translatableProperty: string | undefined) {
	// If translatableProperty isn't set, all pages are automatically ready.
	if (!translatableProperty) return true;

	const fullFilePath = resolve(filePath);
	const frontmatterObj = getFrontmatterProperty(fullFilePath, translatableProperty);

	// If the file format does not support a translatableProperty, the page will be considered ready.
	if (frontmatterObj.context === 'not supported') return true;

	// If the property wasn't found, the page will be considered not ready.
	if (frontmatterObj.context === 'not found') return false;

	if (typeof frontmatterObj.property !== 'boolean') {
		console.error(
			new Error(
				`The specified frontmatter property ${translatableProperty} was found with an non-boolean value. Ensure that all of its occurances are marked either as \`true\` or \`false\`.`
			)
		);
		process.exit(1);
	}

	return frontmatterObj.property;
}

async function getDictionaryTranslationStatus(
	defaultOptionalKeys: OptionalKeys | undefined,
	dictionary: AugmentedFileData | undefined,
	sourceFilePath: string,
	sharedPath: string
) {
	if (!dictionary || dictionary.type === 'generic') return { complete: true, missingKeys: [] };
	const { filePath, optionalKeys } = dictionary;

	const [sourceData, translationData] = await getDictionaryFilesData(sourceFilePath, filePath);

	if (!sourceData || !translationData) {
		console.error(
			new Error(`Could not retrieve the data for the specified dictionary: ${sharedPath}`)
		);
		process.exit(1);
	}

	const missingKeys = Object.keys(sourceData).flatMap((key) => {
		const isOptionalKey =
			(defaultOptionalKeys?.[sharedPath]?.includes(key) ??
				optionalKeys[sharedPath]?.includes(key)) === true;

		if (!translationData.hasOwnProperty(key) && !isOptionalKey) return key;
		return [];
	});

	return {
		complete: !missingKeys.length,
		missingKeys: missingKeys,
	};
}

async function getDictionaryFilesData(
	sourceFilePath: string,
	translationFilePath: string
): Promise<DictionaryObject[]> {
	const parseDictionary = (data: any, filePath: string) => {
		const parsedDictionary = DictionaryContentSchema.safeParse(data);

		if (!parsedDictionary.success) {
			console.error(
				new Error(
					`The dictionary at ${resolve(
						filePath
					)} is not a valid recursive Record of strings. Consider tracking your dictionary as part of the \`content\` object instead.`
				)
			);
			process.exit(1);
		}

		return parsedDictionary.data;
	};

	// JSON Dictionary
	if (extname(sourceFilePath) === '.json') {
		const sourceDictionaryFile = readFileSync(resolve(sourceFilePath), 'utf-8');
		const translationDictionaryFile = readFileSync(resolve(translationFilePath), 'utf-8');

		const sourceDictionaryData = parseDictionary(destr(sourceDictionaryFile), sourceFilePath);
		const translationDictionaryData = parseDictionary(
			destr(translationDictionaryFile),
			translationFilePath
		);

		return [sourceDictionaryData, translationDictionaryData];
	}

	// JS/TS Dictionary
	if (moduleFileExtensions.find((extension) => extension === extname(sourceFilePath))) {
		const sourceDictionaryFile = loadFile(resolve(sourceFilePath));
		const translationDictionaryFile = loadFile(resolve(translationFilePath));

		const sourceDictionaryData = parseDictionary(sourceDictionaryFile, sourceFilePath);
		const translationDictionaryData = parseDictionary(
			translationDictionaryFile,
			translationFilePath
		);

		return [sourceDictionaryData, translationDictionaryData];
	}

	// Frontmatter Dictionary
	if (frontmatterFileExtensions.find((extension) => extension === extname(sourceFilePath))) {
		const sourceDictionaryData = parseDictionary(
			getFrontmatterFromFile(sourceFilePath)!,
			sourceFilePath
		);
		const translationDictionaryData = parseDictionary(
			getFrontmatterFromFile(translationFilePath)!,
			translationFilePath
		);

		return [sourceDictionaryData, translationDictionaryData];
	}

	console.error(
		new Error(
			`Provided dictionary file type (${extname(
				sourceFilePath
			)}) is not currently supported. Please change it or track it as part of the \`content\` field instead.`
		)
	);
	process.exit(1);
}
