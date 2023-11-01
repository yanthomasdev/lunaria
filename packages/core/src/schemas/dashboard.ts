import { z } from 'zod';
import type { CustomComponent, CustomStatusComponent } from '../types.js';

function createComponentSchema<ComponentType extends CustomComponent | CustomStatusComponent>() {
	return z.custom<ComponentType>((val) => {
		if (typeof val === 'function' && typeof val() === 'object') {
			return val()['_$litType$'] ? true : false;
		}
		return false;
	}, 'Custom components need to be a function returning a valid `lit-html` template.');
}

const DashboardUiSchema = z
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
		'status.emojiDone': z.string().default('✔').describe("The dashboard status emoji for 'done'."),
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
	.default({});

export const DashboardSchema = z.object({
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
	ui: DashboardUiSchema,
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

export type Dashboard = z.output<typeof DashboardSchema>;
