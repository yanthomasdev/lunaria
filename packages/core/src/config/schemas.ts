import { isRelative, withoutTrailingSlash } from 'ufo';
import { z } from 'zod';
import { DashboardSchema } from '../dashboard/schemas.js';
import type { LocalizationStatus } from '../types.js';

const RepositorySchema = z.object({
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
		.default('github')
		.describe('The git hosting platform used by your project, e.g. `"github"` or `"gitlab"`'),
});

export const OptionalKeysSchema = z
	.record(z.string(), z.array(z.string()))
	.describe(
		'Record of dictionary shared paths whose values are an array of dictionary keys to be marked as optional'
	);

const BaseFileSchema = z.object({
	/** The glob pattern of where your content including the file type(s) is */
	location: z
		.string()
		.describe(
			'The glob pattern of where your content including the file type(s) is, e.g. `"src/content/docs/**/*.mdx"`'
		),
	/** Array of glob patterns to be ignored from matching */
	ignore: z
		.array(z.string())
		.default([])
		.describe('Array of glob patterns to be ignored from matching'),
	/** A path-to-regexp-like pattern of your content paths */
	pattern: z.string().describe('A path-to-regexp-like pattern describing your content paths'),
	/** The desired type of tracking for this content */
});

const FileSchema = z.discriminatedUnion('type', [
	BaseFileSchema.extend({
		type: z.literal('universal'),
	}),
	BaseFileSchema.extend({
		type: z.literal('dictionary'),
		optionalKeys: OptionalKeysSchema.optional(),
	}),
]);

const LocaleSchema = z.object({
	/** The label of the locale to show in the status dashboard, e.g. `"English"`, `"Português"`, or `"Español"` */
	label: z
		.string()
		.describe(
			'The label of the locale to show in the status dashboard, e.g. `"English"`, `"Português"`, or `"Español"`'
		),
	/** The BCP-47 tag of the locale, both to use in smaller widths and to differentiate regional variants, e.g. `"en-US"` (American English) or `"en-GB"` (British English) */
	lang: z
		.string()
		.describe(
			'The BCP-47 tag of the locale, both to use in smaller widths and to differentiate regional variants, e.g. `"en-US"` (American English) or `"en-GB"` (British English)'
		),
});

export const LunariaConfigSchema = z
	.object({
		/** The location of your Lunaria JSON schema */
		$schema: z.string().optional().describe('The location of your Lunaria JSON schema'),
		/** Options about your generated dashboard */
		dashboard: DashboardSchema.describe('Options about your generated dashboard'),
		/** Information about your project's repository */
		repository: RepositorySchema.describe("Information about your project's repository"),
		/** The default locale of your content that is going to be localized */
		defaultLocale: LocaleSchema.describe(
			'The default locale of your content that is going to be localized'
		),
		/** Array of the localized locales */
		locales: z.array(LocaleSchema).nonempty().describe('Array of the localized locales'),
		/** Array of files to be tracked */
		files: z.array(FileSchema).nonempty().describe('Array of files to be tracked'),
		/** Array of commit keywords that avoid a commit from triggering status changes */
		ignoreKeywords: z
			.array(z.string())
			.default(['lunaria-ignore', 'fix typo'])
			.describe('Array of commit keywords that avoid a commit from triggering status changes'),
		/** Name of the frontmatter property used to mark a file as localizable
		 * and include it as part of the status dashboard. Keep empty for every file to be unconditionally localizable
		 */
		localizableProperty: z
			.string()
			.optional()
			.describe(
				'Name of the frontmatter property used to mark a file as ready for localization. Keep empty for every file to be unconditionally localizable'
			),
		/** The relative directory path of where your dashboard will build to, e.g. `"./dist/lunaria"` */
		outDir: z
			.string()
			.default('./dist/lunaria')
			.describe(
				'A relative directory path of where your dashboard will build to, e.g. `"./dist/lunaria"`'
			),
		/** The relative directory path of your git history clone, exclusively made when running on a shallow repository, e.g. `"./dist/lunaria/history"` */
		cloneDir: z
			.string()
			.default('./node_modules/.cache/lunaria/history')
			.describe(
				'The relative directory path of your git history clone, exclusively made when running on a shallow repository, e.g. `"./dist/lunaria/history"`'
			),
		/** The relative path to a valid `.(c/m)js` or `.(c/m)ts` file containing your dashboard renderer configuration */
		renderer: z
			.string()
			.optional()
			.describe(
				'The relative path to a valid `.(c/m)js` or `.(c/m)ts` file containing your dashboard renderer configuration'
			),
	})
	.superRefine((config, ctx) => {
		const allLocales = [config.defaultLocale, ...config.locales];
		const allLangs = allLocales.map(({ lang }) => lang);

		if (new Set(allLangs).size !== allLocales.length) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'All locales should have a unique `lang` value',
			});
		}
	});

/**
 * Using Zod's z.function() to type these components with argument hints causes
 * an exponential increase in bundle size, therefore we use z.custom();
 * to avoid this, especially because we don't need any complex validation
 * of the arguments in the user's side.
 */

const BaseComponent = z.custom<(config: LunariaConfig) => string>().optional();

const StatusComponent = z
	.custom<(config: LunariaConfig, status: LocalizationStatus[]) => string>()
	.optional();

export const LunariaRendererConfigSchema = z.object({
	slots: z
		.object({
			head: BaseComponent,
			beforeTitle: BaseComponent,
			afterTitle: BaseComponent,
			afterStatusByLocale: BaseComponent,
			afterStatusByFile: BaseComponent,
		})
		.default({}),
	overrides: z
		.object({
			meta: BaseComponent,
			body: StatusComponent,
			statusByLocale: StatusComponent,
			statusByFile: StatusComponent,
		})
		.default({}),
});

export type OptionalKeys = z.infer<typeof OptionalKeysSchema>;
export type Locale = z.infer<typeof LocaleSchema>;
export type File = z.infer<typeof FileSchema>;

export type LunariaConfig = z.infer<typeof LunariaConfigSchema>;
export type LunariaUserConfig = z.input<typeof LunariaConfigSchema>;
export type LunariaRendererConfig = z.infer<typeof LunariaRendererConfigSchema>;
export type LunariaUserRendererConfig = z.input<typeof LunariaRendererConfigSchema>;
