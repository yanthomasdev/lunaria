import { Traverse } from 'neotraverse/modern';
import type { OptionalKeys } from '../config/types.js';
import { InvalidDictionaryFormat } from '../errors/errors.js';
import { fileLoader, fileSupportsFrontmatterRe, frontmatterLoader } from '../files/loaders.js';
import { DictionarySchema } from './schema.js';
import type { Dictionary } from './types.js';

export async function isFileLocalizable(path: string, localizableProperty: string | undefined) {
	// If no localizableProperty is specified, all files are supposed to be localizable.
	if (!localizableProperty) return true;
	// If the file doesn't support frontmatter, it's automatically supposed to be localizable.
	if (!fileSupportsFrontmatterRe.test(path)) return true;

	const frontmatter = await frontmatterLoader(path);

	if (frontmatter instanceof Error) return frontmatter;

	const isLocalizable = frontmatter?.[localizableProperty];

	// If the property is not defined in the frontmatter, we assume the file is not localizable.
	if (typeof isLocalizable === 'undefined') return false;

	// If the type of the property is not a boolean, we assume the file is not localizable.
	if (typeof isLocalizable !== 'boolean') return false;

	return isLocalizable;
}

export async function getDictionaryCompletion(
	optionalKeys: OptionalKeys | undefined,
	sourceDictPath: string,
	localeDictPath: string,
) {
	const sourceDict = await fileLoader(sourceDictPath);
	const localeDict = await fileLoader(localeDictPath);

	if (sourceDict instanceof Error || localeDict instanceof Error) {
		throw sourceDict instanceof Error ? sourceDict : localeDict;
	}

	const parsedSourceDict = DictionarySchema.safeParse(sourceDict);
	if (parsedSourceDict.error) {
		throw new Error(InvalidDictionaryFormat.message(sourceDictPath));
	}

	const parsedLocaleDict = DictionarySchema.safeParse(localeDict);
	if (parsedLocaleDict.error) {
		throw new Error(InvalidDictionaryFormat.message(localeDictPath));
	}

	return findMissingKeys(optionalKeys, parsedSourceDict.data, parsedLocaleDict.data);
}

// TODO: Test this function.
export function findMissingKeys(
	optionalKeys: OptionalKeys | undefined,
	sourceDict: Dictionary,
	localeDict: Dictionary,
) {
	// In case there's no optional keys, we make it so that the traverse object is empty instead of undefined.
	const optionalKeysTraverse = new Traverse(optionalKeys ?? {});
	const sourceDictTraverse = new Traverse(sourceDict);
	const localeDictTraverse = new Traverse(localeDict);

	const hasOptionalParent = (path: PropertyKey[]) => {
		// is upmost parent
		if (path.length === 1) return optionalKeysTraverse.get(path) === true;

		// not upmost parent
		if (optionalKeysTraverse.get(path) === true) return true;

		// check if parent of parent is optional
		return hasOptionalParent([...path].slice(0, -1));
	};

	const missingKeys = sourceDictTraverse
		.paths()
		.map((path) => {
			// Ignore non-leafs
			if (typeof sourceDictTraverse.get(path) === 'object') return undefined;
			// Key is missing
			if (!localeDictTraverse.has(path)) {
				// but parent is optional
				if (path.length > 1 && hasOptionalParent(path)) return undefined;
				// but leaf is optional
				if (optionalKeysTraverse.get(path) === true) return undefined;
				// and is NOT optional
				return path;
			}
			// Key is not missing
			return undefined;
		})
		.filter((key) => key !== undefined);

	return missingKeys;
}
