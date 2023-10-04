import { z } from 'zod';

const LocaleSchema = z.object({
	/** The label of the language to show in the status dashboard, e.g. `"English"`, `"Português"`, or `"Español"`. */
	label: z
		.string()
		.describe(
			'The label of the language to show in the status dashboard, e.g. `"English"`, `"Português"`, or `"Español"`.'
		),
	/** The BCP-47 tag of the language, both to use in smaller widths and to differentiate regional variants, e.g. `"en-US"` (American English) or `"en-GB"` (British English). */
	lang: z
		.string()
		.describe(
			'The BCP-47 tag of the language, both to use in smaller widths and to differentiate regional variants, e.g. `"en-US"` (American English) or `"en-GB"` (British English).'
		),
	/** A relative glob pattern of where your content for the language is and its file type(s), e.g. `"src/content/docs/en/**.mdx"`. */
	contentLocation: z
		.string()
		.describe(
			'A relative glob pattern of where your content for the language is and its file type(s), e.g. `"src/content/docs/en/**.mdx"`.'
		),
});

export const TrackerThingConfigSchema = z.object({
	/** The URL of your current repository, e.g. `"github.com/Yan-Thomas/tracker-thing/"`. */
	repository: z
		.string()
		.url()
		.refine((link) => link.includes('github.com') || link.includes('gitlab.com'), {
			message: 'URL needs to be a valid `"github.com"` or `"gitlab.com"` link.',
		})
		.describe('The URL of your current repository, e.g. `"github.com/Yan-Thomas/tracker-thing/"`.'),
	/** A relative directory path of where your status dashboard will be build to, e.g. `"./dist/translation-status/"`. */
	outDir: z
		.string()
		.default('./dist/translation-status')
		.describe(
			'A relative directory path of where your status dashboard will be build to, e.g. `"./dist/translation-status/"`.'
		),
	/** The default language of your content that will be translated. */
	defaultLocale: LocaleSchema,
	/** Array of the languages that will be translated. */
	locales: z.array(LocaleSchema),
	/** Array of commit keywords that avoid the dashboard from having status changes. */
	ignoreKeywords: z
		.array(z.string())
		.default(['en-only', 'i18nIgnore', 'fix typo'])
		.describe('Array of commit keywords that avoid the dashboard from having status changes.'),
});

export type TrackerThingConfig = z.infer<typeof TrackerThingConfigSchema>;
export type TrackerThingUserConfig = z.input<typeof TrackerThingConfigSchema>;
