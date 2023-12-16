import { z } from 'zod';

const OptionalKeysSchema = z
	.record(z.string(), z.array(z.string()).nonempty())
	.default({})
	.describe(
		"Record of dictionary shared paths whose values are an array of dictionary keys to be marked as optional. While defining on the default locale's object applies it to all languages, you can pass additional keys as part of the specific locale's `optionalKeys` field"
	);

const DictionariesSchema = z
	.object({
		/** A glob pattern of where your UI dictionaries are and its file type(s), e.g. `"src/i18n/en/**.ts"` */
		location: z
			.string()
			.describe(
				'A glob pattern of where your UI dictionaries are and its file type(s), e.g. `"src/i18n/en/**.ts"`'
			),
		/** Array of glob patterns to be ignored from matching */
		ignore: z
			.array(z.string())
			.default([])
			.describe('Array of glob patterns to be ignored from matching'),
		/** Record of dictionary shared paths whose values are an array of dictionary keys to be marked as optional.
		 * While defining on the default locale's object applies it to all languages, you can pass additional keys
		 * as part of the specific locale's `optionalKeys` field */
		optionalKeys: OptionalKeysSchema,
	})
	.optional();

const ContentSchema = z.object({
	/** A glob pattern of where your content for the locale is and its file type(s), e.g. `"src/content/docs/en/**.mdx"` */
	location: z
		.string()
		.describe(
			'A glob pattern of where your content for the locale is and its file type(s), e.g. `"src/content/docs/en/**.mdx"`'
		),
	/** Array of glob patterns to be ignored from matching */
	ignore: z
		.array(z.string())
		.default([])
		.describe('Array of glob patterns to be ignored from matching'),
});

export const LocaleSchema = z
	.object({
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
		/** Information about your UI dictionaries */
		dictionaries: DictionariesSchema.optional().describe('Information about your UI dictionaries'),
		/** Information about your content */
		content: ContentSchema.optional().describe('Information about your content'),
	})
	.refine((locale) => locale.content || locale.dictionaries, {
		message: 'A locale needs to include a `dictionaries` or `content` field to be tracked',
	});

export type Locale = z.output<typeof LocaleSchema>;
export type OptionalKeys = z.infer<typeof OptionalKeysSchema>;
