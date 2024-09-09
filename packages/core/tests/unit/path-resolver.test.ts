import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { createPathResolver } from '../../dist/status/paths.js';

describe('Path resolver', () => {
	/** TODO */
	/**it("should throw when no `lang` and `path` are in the pattern (path for both, lang only in locales pattern)", () => {
        assert.throws(() => createPathResolver("src/content/docs/@lang", { lang: "en", label: "English" }, [{ lang: "pt", label: "Português" }]));
    } **/

	/** Tests to do:
	 * - Properly converts @lang and @path in sourcePattern/localesPattern to path-to-regexp format. (X)
	 * - Makes valid paths from single-string pattern. (toPath) (X)
	 * - Makes valid paths from double-string pattern. (toPath) (X)
	 * - Makes valid paths when the source locale is root (no @lang in source) (both single and double-string pattern) (toPath).
	 * - Correctly matches source and locale paths from single-string pattern. (isSourceMatch/isLocalesMatch).
	 * - Correctly matches source and locale paths from double-string pattern. (isSourceMatch/isLocalesMatch).
	 * - Throws when there's no `lang` (in localesPattern or single string pattern) and `path` (any case).
	 * - Works with a mix between `:path` and `@lang`, or vice-versa.
	 */

	it("should convert pattern from Lunaria's format into path-to-regexp's format", () => {
		/**
		 * Case 1
		 */
		const firstPattern = {
			source: 'src/content/docs/@path',
			locales: 'src/content/i18n/@lang/@path',
		};

		const firstResolver = createPathResolver(firstPattern, { lang: 'en', label: 'English' }, [
			{ lang: 'es', label: 'Spanish' },
			{ lang: 'pt', label: 'Portuguese' },
		]);

		// Checks if the patterns are correctly converted in a double-string pattern.
		assert.equal(firstResolver.sourcePattern, 'src/content/docs/:path(.*)');
		// Also checks if the pattern for when `@lang/` (@lang but directory) is correctly converted.
		assert.equal(firstResolver.localesPattern, 'src/content/i18n/:lang(es|pt)/:path(.*)');

		/**
		 * Case 2
		 */
		const secondPattern = 'pages/:path+.@lang.mdx';

		const secondResolver = createPathResolver(secondPattern, { lang: 'en', label: 'English' }, [
			{ lang: 'es', label: 'Spanish' },
			{ lang: 'pt', label: 'Portuguese' },
		]);

		// Checks if the pattern is correctly converted in a single-string pattern.
		// Also checks if the pattern for when `@lang` is correctly converted.
		assert.equal(secondResolver.sourcePattern, 'pages/:path+.:lang(en).mdx');
		assert.equal(secondResolver.localesPattern, 'pages/:path+.:lang(es|pt).mdx');
	});

	it('should make valid paths from single-string pattern', () => {
		const pattern = 'src/content/docs/@lang/@path';

		const { toPath } = createPathResolver(pattern, { lang: 'en', label: 'English' }, [
			{ lang: 'es', label: 'Spanish' },
			{ lang: 'pt', label: 'Portuguese' },
		]);

		assert.equal(toPath('src/content/docs/en/test.mdx', 'es'), 'src/content/docs/es/test.mdx');
		assert.equal(
			toPath('src/content/docs/en/reference/api-reference.mdx', 'pt'),
			'src/content/docs/pt/reference/api-reference.mdx',
		);
		assert.equal(
			toPath('src/content/docs/es/guides/example.md', 'en'),
			'src/content/docs/en/guides/example.md',
		);
	});

	it('should make valid paths from double-string pattern', () => {
		const pattern = {
			source: 'docs/@path',
			locales: 'translations/@lang/@path',
		};

		const { toPath } = createPathResolver(pattern, { lang: 'en', label: 'English' }, [
			{ lang: 'es', label: 'Spanish' },
			{ lang: 'pt', label: 'Portuguese' },
		]);

		assert.equal(toPath('docs/test.mdx', 'es'), 'translations/es/test.mdx');
		assert.equal(toPath('docs/examples/theory.mdx', 'pt'), 'translations/pt/examples/theory.mdx');
		assert.equal(toPath('translations/pt/recipes/cooking.mdx', 'en'), 'docs/recipes/cooking.mdx');
	});

	it('should correctly match source and locale paths from single-string pattern', () => {
		const pattern = 'docs/@lang/@path';

		const { isSourcePathMatch, isLocalesPathMatch } = createPathResolver(
			pattern,
			{ lang: 'pt', label: 'Portuguese' },
			[
				{ lang: 'es', label: 'Spanish' },
				{ lang: 'en', label: 'English' },
			],
		);

		assert.equal(isSourcePathMatch('docs/pt/test.mdx'), true);
		assert.equal(isSourcePathMatch('docs/es/reference/api-reference.mdx'), false);
		assert.equal(isSourcePathMatch('not/docs/pt/guides/example.md'), false);

		assert.equal(isLocalesPathMatch('docs/es/test.mdx'), true);
		assert.equal(isLocalesPathMatch('docs/zh-cn/reference/api-reference.mdx'), false);
		assert.equal(isLocalesPathMatch('not/docs/en/guides/example.md'), false);
	});

	it('should correctly match source and locale paths from double-string pattern', () => {
		const pattern = {
			source: 'docs/@path',
			locales: 'docs/@lang/@path',
		};

		const { isSourcePathMatch, isLocalesPathMatch, sourcePattern, localesPattern } =
			createPathResolver(pattern, { lang: 'pt', label: 'Portuguese' }, [
				{ lang: 'es', label: 'Spanish' },
				{ lang: 'en', label: 'English' },
			]);

		assert.equal(isSourcePathMatch('docs/test.mdx'), true);
		assert.equal(isSourcePathMatch('docs/es/reference/api-reference.mdx'), false);
		assert.equal(isSourcePathMatch('not/docs/pt/guides/example.md'), false);

		console.log(sourcePattern, localesPattern);
		assert.equal(isLocalesPathMatch('docs/es/test.mdx'), true);
		assert.equal(isLocalesPathMatch('docs/zh-cn/reference/api-reference.mdx'), false);
		assert.equal(isLocalesPathMatch('not/docs/en/guides/example.md'), false);
	});

	it("throws when there's no `:path` in pattern or `:lang` in `localesPattern`", () => {
		assert.throws(() =>
			createPathResolver('docs/@lang', { lang: 'en', label: 'English' }, [
				{
					lang: 'es',
					label: 'Spanish',
				},
			]),
		);

		assert.throws(() =>
			createPathResolver('docs/@path', { lang: 'en', label: 'English' }, [
				{
					lang: 'es',
					label: 'Spanish',
				},
			]),
		);

		assert.throws(() =>
			createPathResolver(
				{ source: 'docs/@path', locales: 'docs/@lang' },
				{ lang: 'en', label: 'English' },
				[
					{
						lang: 'es',
						label: 'Spanish',
					},
				],
			),
		);
	});
});
