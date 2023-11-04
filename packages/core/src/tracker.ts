import glob from 'fast-glob';
import micromatch from 'micromatch';
import { readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { rehype } from 'rehype';
import rehypeFormat from 'rehype-format';
import type { DefaultLogFields, ListLogLine } from 'simple-git';
import { normalizeURL } from 'ufo';
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
	OptionalKeys,
	RegExpGroups,
} from './types.js';
import { getPageHistory } from './utils/git.js';
import {
	getFrontmatterFromFile,
	getFrontmatterProperty,
	getGitHubURL,
	loadFile,
	renderToString,
	toUtcString,
} from './utils/misc.js';

export async function getTranslationStatus(
	opts: LunariaConfig,
	fileContentIndex: FileContentIndex
) {
	const { defaultLocale, locales, repository, rootDir, localePathConstructor } = opts;
	const sourceLocaleIndex = fileContentIndex[defaultLocale.lang];
	const translationStatus: FileTranslationStatus[] = [];

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
				gitHubURL: getGitHubURL({
					repository: repository,
					rootDir: rootDir,
					filePath: sourceFile.filePath,
				}),
				translations: {},
			};

			await Promise.all(
				locales.map(async ({ lang }) => {
					const translationFile = fileContentIndex[lang]?.[sharedPath];

					const localeFilePath = localePathConstructor({
						localeLang: lang,
						sourceLang: defaultLocale.lang,
						sourcePath: sourceFile.filePath,
					});

					const existingPageURL = getGitHubURL({
						repository: repository,
						rootDir: rootDir,
						filePath: localeFilePath,
					});

					const missingPageURL = getGitHubURL({
						repository: repository,
						rootDir: rootDir,
						type: 'new',
						query: normalizeURL(`?filename=${localeFilePath}`),
					});

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
						gitHubURL: !translationFile ? missingPageURL : existingPageURL,
						sourceHistoryURL: getGitHubURL({
							repository: repository,
							rootDir: rootDir,
							filePath: sourceFile.filePath,
							query: translationFile ? `?since=${translationFile.lastMajorChange}` : '',
						}),
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
		rootDir,
		defaultLocale,
		locales,
		ignoreKeywords,
		sharedPathResolver,
	} = opts;

	const allLocales = [defaultLocale, ...locales];
	const fileContentIndex: FileContentIndex = {};

	for (const { lang, content, dictionaries } of allLocales) {
		const localeContentPaths = await glob(content.location, {
			cwd: process.cwd(),
			ignore: ['node_modules', ...content.ignore],
		});

		const genericContentIndex = await Promise.all(
			localeContentPaths.sort().map(async (filePath) => {
				const sharedPath = sharedPathResolver({ lang, localePath: filePath });

				return {
					lang,
					filePath,
					sharedPath,
					fileData: await getFileData(
						filePath,
						isShallowRepo,
						rootDir,
						translatableProperty,
						ignoreKeywords
					),
					additionalData: {
						type: 'generic',
					},
				} as IndexData;
			})
		);

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
						const sharedPath = sharedPathResolver({ lang: lang, localePath: filePath });
						// Create or update page data for the page
						return {
							lang,
							filePath,
							sharedPath,
							fileData: await getFileData(
								filePath,
								isShallowRepo,
								rootDir,
								translatableProperty,
								ignoreKeywords
							),
							additionalData: {
								type: 'dictionary',
								optionalKeys: optionalKeys,
							},
						} as IndexData;
					})
				))
			);
		}

		[...dictionaryContentIndex, ...genericContentIndex].forEach(
			({ lang, sharedPath, fileData, additionalData }) => {
				fileContentIndex[lang] = {
					...fileContentIndex[lang],
					[sharedPath]: {
						...fileData,
						...additionalData,
					},
				};
			}
		);
	}

	return fileContentIndex;
}

export async function generateDashboardHtml(
	opts: LunariaConfig,
	translationStatus: FileTranslationStatus[]
) {
	const html = await rehype()
		.use(rehypeFormat)
		.process(renderToString(Page(opts, translationStatus)));
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
	 * that means we have to consider the project's root
	 * directory to avoid errors while searching the git history.
	 */

	// TODO: Test on shallow repo on to see if this is working!
	const monorepoSafePath = join(isShallowRepo ? rootDir : '', filePath);
	const historyData = await getPageHistory(monorepoSafePath);

	const allCommits = historyData.all;
	const lastCommit = historyData.latest;

	if (!lastCommit || !allCommits) {
		console.error(
			new Error(
				`Failed to retrive last commit data from ${resolve(
					monorepoSafePath
				)}. Your working copy should not contain uncommitted new pages when running this script. This might also happen when developing locally on a monorepo.`
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
		// TODO: Test if that has 100% compatibility with i18n Tracker in Astro Docs.
		if (entry.message.match(IGNORE_KEYWORDS)) return false;

		const trackerDirectiveMatch: RegExpGroups<'directive' | 'pathsOrGlobs'> =
			entry.body.match(TRACKER_DIRECTIVES);

		if (!trackerDirectiveMatch || !trackerDirectiveMatch.groups) return true;

		const { directive, pathsOrGlobs } = trackerDirectiveMatch.groups;

		const pathsOrGlobsList = pathsOrGlobs.split(';');

		// TODO: Test if this is working
		pathsOrGlobsList.find((pathOrGlob) => {
			if (directive === '@tracker-major') return micromatch.isMatch(filePath, pathOrGlob);
			if (directive === '@tracker-minor') return !micromatch.isMatch(filePath, pathOrGlob);
		});
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
	console.log(frontmatterObj);

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

		const sourceDictionaryData = parseDictionary(JSON.parse(sourceDictionaryFile), sourceFilePath);
		const translationDictionaryData = parseDictionary(
			JSON.parse(translationDictionaryFile),
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
