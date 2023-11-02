import { z } from 'zod';

const DictionariesSchema = z
	.object({
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
	})
	.optional();

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

export const LocaleSchema = z.object({
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
	dictionaries: DictionariesSchema,
	/** Information about your content. */
	content: ContentSchema,
});

export type Locale = z.output<typeof LocaleSchema>;
