import { isRelative, withoutTrailingSlash } from 'ufo';
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
	}, 'Custom components need to be a function returning a valid Lit template');
}

export const customRoutingStrategyOptionsSchema = z.object({
	/** The regex pattern to find the path section to be replaced. You can use :locales to dynamically add a list of all the locales in the format `'es|pt|ar'` */
	regex: z
		.string()
		.describe(
			"The regex pattern to find the path section to be replaced. You can use :locales to dynamically add a list of all the locales in the format `'es|pt|ar'`"
		),
	/** The content that will be replaced into the `toLocalePath` regex's match. You can use :locale to dynamically add the current locale for you to replace with */
	localePathReplaceWith: z
		.string()
		.describe(
			"The content that will be replaced into the `toLocalePath` regex's match. You can use :locale to dynamically add the current locale for you to replace with"
		),
	/** The content that will be replaced into the `toSharedPath` regex's match */
	sharedPathReplaceWith: z
		.string()
		.describe("The content that will be replaced into the `toSharedPath` regex's match"),
});

export const customGitHostingOptionsSchema = z.object({
	create: z.string().or(z.null()),
	source: z.string().or(z.null()),
	history: z.string().or(z.null()),
	clone: z.string(),
});

export const repositorySchema = z.object({
	/** The unique name of your repository in your git hosting platform, e.g. `"Yan-Thomas/lunaria"` */
	name: z
		.string()
		.transform((path) => withoutTrailingSlash(path))
		.describe(
			'The unique name of your repository in your git hosting platform, e.g. `"Yan-Thomas/lunaria"`'
		),
	/** The currently tracked branch of your repository */
	branch: z.string().default('main').describe('The currently tracked branch of your repository'),
	/** The root directory of the project being tracked, must be set when using a monorepo */
	/** TODO: Fix rootDir usage when not using a monorepo! */
	rootDir: z
		.string()
		.default('.')
		.refine((path) => !isRelative(path), {
			message:
				'The root directory should not be a relative path, it should follow the example: `examples/vitepress`',
		})
		.transform((path) => withoutTrailingSlash(path))
		.describe('The root directory of the project being tracked, must be set when using a monorepo'),
	/** The git hosting platform used by your project, e.g. `"github"` or `"gitlab"` */
	hosting: z
		.literal('github')
		.or(z.literal('gitlab'))
		.or(customGitHostingOptionsSchema)
		.default('github')
		.describe('The git hosting platform used by your project, e.g. `"github"` or `"gitlab"`'),
});

export const LunariaConfigSchema = z
	.object({
		/** The location of your Lunaria JSON schema */
		$schema: z.string().optional().describe('The location of your Lunaria JSON schema'),
		/** Options about your generated dashboard */
		dashboard: DashboardSchema.describe('Options about your generated dashboard'),
		/** Information about your project's repository */
		repository: repositorySchema.describe("Information about your project's repository"),
		/** The default locale of your content that is going to be localized */
		defaultLocale: LocaleSchema.describe(
			'The default locale of your content that is going to be localized'
		),
		/** Array of the localized locales */
		locales: z.array(LocaleSchema).nonempty().describe('Array of the localized locales'),
		/** Array of commit keywords that avoid a commit from trigerring status changes */
		ignoreKeywords: z
			.array(z.string())
			.default(['lunaria-ignore', 'fix typo'])
			.describe('Array of commit keywords that avoid a commit from trigerring status changes'),
		/** Name of the frontmatter property used to mark a page as translatable
		 * and include it as part of the status dashboard. Keep it empty if you
		 * want every page to be unconditionally translatable.
		 */
		translatableProperty: z
			.string()
			.optional()
			.describe('Name of the frontmatter property used to mark a page as ready for translation'),
		/** The routing strategy used by your framework, used to properly generate paths from a locale's path */
		routingStrategy: z
			.literal('directory')
			.or(z.literal('file'))
			.or(customRoutingStrategyOptionsSchema)
			.default('directory')
			.describe(
				"The routing strategy used by your framework, used to properly generate paths from a locale's path"
			),
		/** The relative directory path of where your dashboard will build to, e.g. `"./dist/translation-status/index.html"` */
		outDir: z
			.string()
			.default('./dist/translation-status/index.html')
			.describe(
				'A relative directory path of where your dashboard will build to, e.g. `"./dist/translation-status/index.html"`'
			),
		/** The relative directory path of your git history clone, exclusively made when running on a shallow repository, e.g. `"./dist/history"` */
		cloneDir: z
			.string()
			.default('./dist/history')
			.describe(
				'The relative directory path of your git history clone, exclusively made when running on a shallow repository, e.g. `"./dist/history"`'
			),
		/** The relative path to a valid `.(c/m)js` or `.(c/m)ts` file containing your dashboard renderer configuration */
		renderer: z
			.string()
			.optional()
			.describe(
				'The relative path to a valid `.(c/m)js` or `.(c/m)ts` file containing your dashboard renderer configuration'
			),
	})
	.superRefine((opts, ctx) => {
		const allLocales = [opts.defaultLocale, ...opts.locales];
		const allLangs = allLocales.map(({ lang }) => lang);

		if (new Set(allLangs).size !== allLocales.length) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'All locales should have a unique `lang` value',
			});
		}
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
