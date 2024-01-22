import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { code, error, highlight } from '../cli/console.js';
import type { OptionalKeys } from '../config/index.js';
import { type Dictionary } from '../types.js';
import { loadWithJiti } from '../utils.js';
import { frontmatterFile, getFileFrontmatter } from './frontmatter.js';
import { DictionaryContentSchema } from './index.js';

export async function getDictionaryCompletion(
	optionalKeys: OptionalKeys | undefined,
	localizationFilePath: string,
	sourceFilePath: string,
	sharedPath: string
) {
	const sourceDictionary = await loadDictionary(sourceFilePath);
	const localizationDictionary = await loadDictionary(localizationFilePath);

	const missingKeys = Object.keys(sourceDictionary).flatMap((key) => {
		const isOptionalKey = optionalKeys?.[sharedPath]?.includes(key) === true;
		if (!localizationDictionary.hasOwnProperty(key) && !isOptionalKey) return key;
		return [];
	});

	return missingKeys;
}

async function loadDictionary(path: string) {
	/** Dictionaries are loaded differently depending on the file type. */

	/** Frontmatter Dictionary */
	if (frontmatterFile.test(path)) {
		try {
			const file = getFileFrontmatter(path);
			const dictionary = validateDictionary(file);

			return dictionary;
		} catch (e) {
			console.error(error(`Failed to load frontmatter dictionary at ${highlight(path)}\n`));
			throw e;
		}
	}

	/** JSON Dictionary */
	if (/\.json$/.test(path)) {
		try {
			const resolvedPath = resolve(path);

			const file = readFileSync(resolvedPath, 'utf-8');
			const dictionary = validateDictionary(JSON.parse(file));

			return dictionary;
		} catch (e) {
			console.error(error(`Failed to load JSON dictionary at ${highlight(path)}\n`));
			throw e;
		}
	}

	/** JS/TS Dictionary */
	if (/\.(c|m)?(js|ts)$/.test(path)) {
		try {
			const file = loadWithJiti(path);
			const dictionary = validateDictionary(file);

			return dictionary;
		} catch (e) {
			console.error(error(`Failed to load JS/TS module dictionary at ${highlight(path)}\n`));
			throw e;
		}
	}

	console.error(
		error(
			`Invalid dictionary file type: ${code(
				extname(path)
			)}. Ensure it has one of the valid extensions or track it using ${code(
				'type: "universal"'
			)} instead.`
		)
	);
	process.exit(1);
}

async function validateDictionary(dictionary: Dictionary | undefined) {
	const parsedDictionary = DictionaryContentSchema.safeParse(dictionary);

	if (parsedDictionary.success) {
		return parsedDictionary.data;
	}

	console.error(
		error(
			'Invalid dictionary shape, ensure it is a valid recursive Record of strings or track it as a `universal` file type instead.'
		)
	);
	process.exit(1);
}
