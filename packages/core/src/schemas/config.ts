import { normalizeURL } from 'ufo';
import { z } from 'zod';
import { DashboardSchema } from '../schemas/dashboard.js';
import { LocaleSchema } from '../schemas/locale.js';
import type { CustomComponent, CustomStatusComponent } from '../types.js';

function createComponentSchema<ComponentType extends CustomComponent | CustomStatusComponent>() {
	return z.custom<ComponentType>((val) => {
		if (typeof val === 'function' && typeof val() === 'object') {
			return val()['_$litType$'] ? true : false;
		}
		return false;
	}, 'Custom components need to be a function returning a valid `lit-html` template.');
}

/**  */
export const customRoutingStrategyOptionsSchema = z.object({
	regex: z
		.string()
		.describe(
			"A regex pattern to find the path section to be replaced. You can use :lunaria-locales to dynamically add a list of all the locales in the format `'es|pt|ar'`."
		),
	localePathReplaceWith: z
		.string()
		.describe(
			"The content that will be replaced into the `toLocalePath` regex's match. You can use :lunaria-locale to dynamically add the current locale for you to replace with."
		),
	sharedPathReplaceWith: z
		.string()
		.describe("The content that will be replaced into the `toSharedPath` regex's match."),
});

export const LunariaConfigSchema = z.object({
	/** Options about your generated dashboard. */
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
	/** The routing strategy used by your framework, used to properly generate paths from a locale's path. */
	routingStrategy: z
		.literal('directory')
		.or(z.literal('file'))
		.or(customRoutingStrategyOptionsSchema)
		.default('directory')
		.describe(
			"The routing strategy used by your framework, used to properly generate paths from a locale's path."
		),
	/** The URL of your current repository, used to generate history links, e.g. `"https://github.com/Yan-Thomas/lunaria/"`. */
	repository: z
		.string()
		.url()
		.refine((url) => url.startsWith('https://github.com/'), {
			message: 'URL needs to be a valid GitHub link (`"https://github.com/"`).',
		})
		.transform((url) => normalizeURL(url))
		.describe(
			'The URL of your current repository, used to generate history links, e.g. `"https://github.com/Yan-Thomas/lunaria/"`.'
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
	/** The relative path to a valid `.(c/m)js` or `.(c/m)ts` file containing your dashboard renderer configuration. */
	renderer: z
		.string()
		.optional()
		.describe(
			'The relative path to a valid `.(c/m)js` or `.(c/m)ts` file containing your dashboard renderer configuration.'
		),
});

export const LunariaRendererConfigSchema = z.object({
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

export type LunariaConfig = z.infer<typeof LunariaConfigSchema>;
export type LunariaUserConfig = z.input<typeof LunariaConfigSchema>;
export type LunariaRendererConfig = z.infer<typeof LunariaRendererConfigSchema>;
export type LunariaUserRendererConfig = z.input<typeof LunariaRendererConfigSchema>;
