import { z } from 'zod';
import type { CustomComponent, CustomStatusComponent } from '../types';

function createComponentSchema<ComponentType extends CustomComponent | CustomStatusComponent>() {
	return z.custom<ComponentType>((val) => {
		if (typeof val === 'function' && typeof val() === 'object') {
			return val()['_$litType$'] ? true : false;
		}
		return false;
	}, 'Custom components need to be a function returning a valid `lit-html` template.');
}

const DictionariesSchema = z.object({
	/** A glob pattern of where your UI dictionaries are and its file type(s), e.g. `"src/i18n/en/**.ts"`. */
	location: z
		.string()
		.describe(
			'A glob pattern of where your UI dictionaries are and its file type(s), e.g. `"src/i18n/en/**.ts"`.'
		),
	/** Array of glob patterns to be ignored from matching. */
	ignore: z
		.array(z.string())
		.default([])
		.describe('Array of glob patterns to be ignored from matching.'),
	/** Object whose keys equals to true will have its translation considered optional. The value configured in the defaultLocale will be considered for all locales, while individual locales can override it with locale-specific information. */
	optionalKeys: z.array(z.string()).optional(),
	/** The name of the export that will be used to import your dictionary. As the initial value, the default export is used. */
	module: z
		.string()
		.default('default')
		.describe(
			'The name of the export that will be used to import your dictionary. As the initial value, the default export is used.'
		),
});

const ContentSchema = z.object({
	/** A glob pattern of where your content for the locale is and its file type(s), e.g. `"src/content/docs/en/**.mdx"`. */
	location: z
		.string()
		.describe(
			'A glob pattern of where your content for the locale is and its file type(s), e.g. `"src/content/docs/en/**.mdx"`.'
		),
	/** Array of glob patterns to be ignored from matching. */
	ignore: z
		.array(z.string())
		.default([])
		.describe('Array of glob patterns to be ignored from matching.'),
});

const LocaleSchema = z.object({
	/** The label of the locale to show in the status dashboard, e.g. `"English"`, `"Português"`, or `"Español"`. */
	label: z
		.string()
		.describe(
			'The label of the locale to show in the status dashboard, e.g. `"English"`, `"Português"`, or `"Español"`.'
		),
	/** The BCP-47 tag of the locale, both to use in smaller widths and to differentiate regional variants, e.g. `"en-US"` (American English) or `"en-GB"` (British English). */
	lang: z
		.string()
		.describe(
			'The BCP-47 tag of the locale, both to use in smaller widths and to differentiate regional variants, e.g. `"en-US"` (American English) or `"en-GB"` (British English).'
		),
	/** Information about any of your UI dictionaries. */
	dictionaries: DictionariesSchema.optional(),
	/** Information about your content. */
	content: ContentSchema,
});

const SharedPathResolverSchema = z
	.function()
	.args(
		z.object({
			lang: z.string(),
			filePath: z.string(),
		})
	)
	.returns(z.string())
	.optional();

const DashboardSchema = z.object({
	/** The title of your translation dashboard, used as both the main heading and meta title of the page. */
	title: z
		.string()
		.default('Translation Status')
		.describe(
			'The title of your translation dashboard, used as both the main heading and meta title of the page.'
		),
	/** The description of your translation dashboard, used in the meta tags of the page. */
	description: z
		.string()
		.default('Online translation status dashboard of the project ')
		.describe('The description of your translation dashboard, used in the meta tags of the page.'),
	/** The deployed URL of your translation dashboard, used in the meta tags of the page. */
	url: z
		.string()
		.url()
		.describe('The deployed URL of your translation dashboard, used in the meta tags of the page.'),
	/** UI dictionary of the dashboard, including the desired `lang` and `dir` attributes of the page. */
	ui: z
		.object({
			/** The BCP-47 tag of the dashboard's UI, used as the page's `lang` attribute, e.g. `'en'` or `'pt-BR'`. */
			lang: z
				.string()
				.default('en')
				.describe(
					"The BCP-47 tag of the dashboard's UI, used as the page's `lang` attribute, e.g. `'en'` or `'pt-BR'`."
				),
			/** The directionality of the page's text, used as the page's `dir` attribute. It can be either `'ltr'` (left-to-right) or `'rtl'` (right-to-left). */
			dir: z
				.literal('ltr')
				.or(z.literal('rtl'))
				.default('ltr')
				.describe(
					"The directionality of the page's text, used as the page's `dir` attribute. It can be either `'ltr'` (left-to-right) or `'rtl'` (right-to-left)."
				),
			/** The dashboard status of 'done'. */
			'status.done': z.string().default('done').describe("The dashboard status of 'done'."),
			/** The dashboard status of 'outdated'. */
			'status.outdated': z
				.string()
				.default('outdated')
				.describe("The dashboard status of 'outdated'."),
			/** The dashboard status 'missing'. */
			'status.missing': z.string().default('missing').describe("The dashboard status 'missing'."),
			/** The dashboard status emoji for 'done'. */
			'status.emojiDone': z
				.string()
				.default('✔')
				.describe("The dashboard status emoji for 'done'."),
			/** The dashboard status emoji for 'outdated'. */
			'status.emojiOutdated': z
				.string()
				.default('🔄')
				.describe("The dashboard status emoji for 'outdated'."),
			/** The dashboard status emoji for 'missing'. */
			'status.emojiMissing': z
				.string()
				.default('❌')
				.describe("The dashboard status emoji for 'missing'."),
			/** The heading text that precedes the dropdown lists of each locale's individual progress. */
			'statusByLocale.heading': z
				.string()
				.default('Translation progress by locale')
				.describe(
					"The heading text that precedes the dropdown lists of each locale's individual progress."
				),
			/** The locale's individual status details summary format. The '{*_amount}' and `{*_word}`
			 * are placeholder values for the amount of pages (e.g. '10') in the status and the status word
			 * (e.g. 'done'), respectively.  */
			'statusByLocale.detailsSummaryFormat': z
				.string()
				.default(
					'{done_amount} {done_word}, {outdated_amount} {outdated_word}, {missing_amount} {missing_word}'
				)
				.describe(
					"The locale's individual status details summary format. The '{*_amount}' and `{*_word}` are placeholder values for the amount of pages (e.g. '10') in the status and the status word (e.g. 'done'), respectively."
				),
			/** The locale's details title format. The `{locale_name} and `{locale_tag}` are placeholder values
			 *  for the locale's name (e.g. English) and the locale's BCP-47 tag (e.g. en), respectively.  */
			'statusByLocale.detailsTitleFormat': z
				.string()
				.default('{locale_name} ({locale_tag})')
				.describe(
					"The locale's details title format. The `{locale_name} and `{locale_tag}` are placeholder valuesfor the locale's name (e.g. English) and the locale's BCP-47 tag (e.g. en), respectively."
				),
			/** The text for the locale's details oudated translation link. */
			'statusByLocale.outdatedTranslationLink': z
				.string()
				.default('outdated translation')
				.describe("The text for the locale's details oudated translation link."),
			/** The text for the locale's details incomplete translation link. */
			'statusByLocale.incompleteTranslationLink': z
				.string()
				.default('incomplete translation')
				.describe("The text for the locale's details incomplete translation link."),
			/** The text for the locale's details source change history link. */
			'statusByLocale.sourceChangeHistoryLink': z
				.string()
				.default('source change history')
				.describe("The text for the locale's details source change history link."),
			/** The text for the locale's details UI dictionary missing keys heading. */
			'statusByLocale.missingKeys': z
				.string()
				.default('Missing keys')
				.describe("The text for the locale's details UI dictionary missing keys heading."),
			/** The text shown in the locale's details when it is complete. */
			'statusByLocale.completeTranslation': z
				.string()
				.default('This translation is complete, amazing job! 🎉')
				.describe("The text shown in the locale's details when it is complete."),
			/** The heading text that precedes the table with all locale's status by content. */
			'statusByContent.heading': z
				.string()
				.default('Translation status by content')
				.describe("The heading text that precedes the table with all locale's status by content."),
			/** The text for the status dashboard table's 'content' row head. */
			'statusByContent.tableRowPage': z
				.string()
				.default('Content')
				.describe("The text for the status dashboard table's 'content' row head."),
			/** The dashboard table's summary format. The `{*_emoji}` and `{*_word}` are placeholder values for the status emoji (e.g. '❌') and its word (e.g. 'missing'). */
			'statusByContent.tableSummaryFormat': z
				.string()
				.default(
					'{missing_emoji} {missing_word} &nbsp; {outdated_emoji} {outdated_word} &nbsp; {done_emoji} {done_word}'
				)
				.describe(
					"The dashboard table's summary format. The `{*_emoji}` and `{*_word}` are placeholder values for the status emoji (e.g. '❌') and its word (e.g. 'missing')."
				),
		})
		.default({}),
	slots: z
		.object({
			head: createComponentSchema<CustomComponent>().optional(),
			beforeTitle: createComponentSchema<CustomComponent>().optional(),
			afterTitle: createComponentSchema<CustomComponent>().optional(),
		})
		.default({}),
	overrides: z
		.object({
			meta: createComponentSchema<CustomComponent>().optional(),
			styles: createComponentSchema<CustomComponent>().optional(),
			body: createComponentSchema<CustomStatusComponent>().optional(),
			statusByLocale: createComponentSchema<CustomStatusComponent>().optional(),
			statusByContent: createComponentSchema<CustomStatusComponent>().optional(),
		})
		.default({}),
});

export const LunariaConfigSchema = z.object({
	dashboard: DashboardSchema,
	/** The default locale of your content that is going to be translated. */
	defaultLocale: LocaleSchema,
	/** Array of the locales that will be translated. */
	locales: z.array(LocaleSchema).nonempty(),
	/** Array of commit keywords that avoid a commit from trigerring status changes. */
	ignoreKeywords: z
		.array(z.string())
		.default(['en-only', 'i18nIgnore', 'fix typo'])
		.describe('Array of commit keywords that avoid a commit from trigerring status changes.'),
	/** Name of the frontmatter property used to mark a page as translatable
	 * and include it as part of the status dashboard. Keep it empty if you
	 * want every page to be unconditionally translatable.
	 */
	translatableProperty: z
		.string()
		.optional()
		.describe('Name of the frontmatter property used to mark a page as ready for translation.'),
	/** Custom fuction to handle the shared path resolver, used to "link" pages between two locales. */
	customSharedPathResolver: SharedPathResolverSchema.describe(
		'Custom fuction to handle the shared path resolver, used to "link" pages between two locales.'
	),
	/** The URL of your current repository, used to generate history links, e.g. `"https://github.com/Yan-Thomas/lunaria"`. */
	repository: z
		.string()
		.url()
		.refine(
			(link) => link.startsWith('https://github.com/') || link.startsWith('https://gitlab.com/'),
			{
				message: 'URL needs to be a valid `"https://github.com/"` or `"https://gitlab.com/"` link.',
			}
		)
		// Removes any trailing slashes
		.transform((link) => link.replace(/\/+$/, ''))
		.describe(
			'The URL of your current repository, used to generate history links, e.g. `"github.com/Yan-Thomas/lunaria"`.'
		),
	/** The root directory of the project being tracked, must be set when using a monorepo.
	 *
	 * @example
	 * Take this project structure as an example:
	 * ```md
	 * ├── docs/
	 * ├── packages/
	 * |   ├── package-one/
	 * |   ├── package-two/
	 * ```
	 * Considering you're tracking your docs located at `docs/`, `rootDir` should be defined like the following:
	 * ```json
	 * rootDir: "./docs"
	 * ```
	 *
	 * This is necessary because when using a shallow repository, as the entire monorepo is downloaded,
	 * and therefore there's no other way to reliably know where your content being tracked is.
	 */
	rootDir: z
		.string()
		.default('.')
		.describe(
			'The root directory of the project being tracked, must be set when using a monorepo.'
		),
	/** The relative directory path of where your dashboard will build to, e.g. `"./dist/translation-status/index.html"`. */
	outDir: z
		.string()
		.default('./dist/translation-status/index.html')
		.describe(
			'A relative directory path of where your dashboard will build to, e.g. `"./dist/translation-status/index.html"`.'
		),
	/** The relative directory path of your git history clone, exclusively made when running on a shallow repository, e.g. `"./dist/history"` */
	cloneDir: z
		.string()
		.default('./dist/history')
		.describe(
			'The relative directory path of your git history clone, exclusively made when running on a shallow repository, e.g. `"./dist/history"`'
		),
});

export type Locale = z.output<typeof LocaleSchema>;
export type SharedPathResolver = z.infer<typeof SharedPathResolverSchema>;
export type Dashboard = z.output<typeof DashboardSchema>;
export type LunariaConfig = z.infer<typeof LunariaConfigSchema>;
export type LunariaUserConfig = z.input<typeof LunariaConfigSchema>;
