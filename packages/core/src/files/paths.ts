import { type MatchResult, compile, match } from 'path-to-regexp';
import type { LunariaConfig, Pattern } from '../config/types.js';
import { InvalidFilesPattern } from '../errors/errors.js';
import { stringFromFormat } from '../utils/utils.js';
import type { PathResolver } from './types.js';

/** Returns any missing parameters found for the specified pattern */
function findMissingParameter(pattern: string, parameters: string[]) {
	return parameters.find((param) => !pattern.includes(param));
}

/**
 * Returns a couple of functions to match and generate paths from the specified pattern.
 * This is used mostly to dynamically find the paths for localizations based on the source file paths.
 */
export function createPathResolver(
	pattern: Pattern,
	sourceLocale: LunariaConfig['sourceLocale'],
	locales: LunariaConfig['locales'],
): PathResolver {
	/**
	 * We have to change the accepted locales for each pattern, since the source pattern
	 * should only accept the source locale, and the locales pattern should accept all the other locales.
	 */
	const allLocalizedLangs = locales.map(({ lang }) => lang);
	const allLocalizedLocalesJoin = allLocalizedLangs.join('|');

	// @lang - Matches the locale part of the path.
	const langPattern = (locales: string) => `:lang(${locales})`;
	// @path - Matches the rest of the path.
	const pathPattern = ':path(.*)';

	const placeholders = (locales: string): Record<string, string> => {
		return {
			'@lang': langPattern(locales),
			'@path': pathPattern,
		};
	};

	// We accept either a single string pattern or one for souce and localized content
	// This is meant to support cases where the path for the source content is
	// different from the localized content.
	const baseSourcePattern = typeof pattern === 'string' ? pattern : pattern.source;
	const baseLocalesPattern = typeof pattern === 'string' ? pattern : pattern.locales;

	const sourcePattern = stringFromFormat(baseSourcePattern, placeholders(sourceLocale.lang));
	const localesPattern = stringFromFormat(
		baseLocalesPattern,
		placeholders(allLocalizedLocalesJoin),
	);

	const missingSourceParameter = findMissingParameter(sourcePattern, [':path']);

	if (missingSourceParameter) {
		throw new Error(InvalidFilesPattern.message(baseSourcePattern, missingSourceParameter));
	}

	const missingLocalesParameter = findMissingParameter(localesPattern, [':path', ':lang']);

	if (missingLocalesParameter) {
		throw new Error(InvalidFilesPattern.message(baseLocalesPattern, missingLocalesParameter));
	}

	return {
		// `match` returns an object if true, here we're forcing it to return a boolean.
		/**
		 * Explanation: why does `isSourcePathMatch` checks if it isn't a locales path but `isLocalesPathMatch` doesn't?
		 * In a few cases, the source path can end up matching the locales path, like so:
		 *
		 * - Source path: `docs/test.mdx` (sourcePattern: `docs/@path`)
		 * - Locales path: `docs/en/test.mdx` (localesPattern: `docs/@lang/@path`)
		 *
		 * In this case, the locales path fulfills the source pattern match, but the opposite can't happen, considering
		 * the locales path strictly requires the `@lang` parameter that is limited to the configured locales.
		 */
		isSourcePathMatch: (path: string) =>
			!!match(sourcePattern)(path) && !match(localesPattern)(path),
		isLocalesPathMatch: (path: string) => !!match(localesPattern)(path),
		toPath: (fromPath: string, toLang: string) => {
			// Since the path for the same source and localized content can have different patterns,
			// we have to check if the `toLang` is from the sourceLocale (i.e. source content) or
			// from the localized content, meaning we get the correct path always.
			const selectedPattern = allLocalizedLangs.includes(toLang) ? localesPattern : sourcePattern;
			const inverseSelectedPattern =
				selectedPattern === sourcePattern ? localesPattern : sourcePattern;

			const matcher = match(inverseSelectedPattern) as (
				path: string,
			) => MatchResult<{ lang?: string; path: string }>;

			return compile<{ lang?: string; path: string }>(selectedPattern)({
				lang: toLang,
				// We extract the common path from `fromPath` to build the resulting path.
				path: matcher(fromPath).params.path,
			});
		},
		sourcePattern: sourcePattern,
		localesPattern: localesPattern,
	};
}
