import { nothing, type TemplateResult } from 'lit';
import { html, unsafeStatic } from 'lit/static-html.js';
import type {
	Dashboard,
	FileTranslationStatus,
	Locale,
	LunariaConfig,
	LunariaRendererConfig,
	TranslationStatus,
} from '../types.js';
import { getStringFromFormat } from '../utils/misc.js';
import { Styles } from './styles.js';
import { getCollapsedPath, inlineCustomCssFiles, readAsset } from './utils.js';

export const Page = (
	opts: LunariaConfig,
	rendererOpts: LunariaRendererConfig,
	translationStatus: FileTranslationStatus[]
): TemplateResult => {
	const { dashboard } = opts;
	const { slots, overrides } = rendererOpts;
	const inlinedCssFiles = inlineCustomCssFiles(dashboard.customCss);

	return html`
		<!doctype html>
		<html dir="${unsafeStatic(dashboard.ui.dir)}" lang="${unsafeStatic(dashboard.ui.lang)}">
			<head>
				<!-- Built-in/custom meta tags -->
				${overrides.meta?.(opts) ?? Meta(dashboard)}
				<!-- Additional head tags -->
				${slots.head?.(opts) ?? nothing}
				<!-- Built-in styles -->
				${Styles}
				<!-- Custom styles -->
				${inlinedCssFiles
					? inlinedCssFiles.map(
							(css) =>
								html`<style>
									${unsafeStatic(css)}
								</style>`
					  )
					: nothing}
			</head>
			<body>
				<!-- Built-in/custom body content -->
				${overrides.body?.(opts, translationStatus) ?? Body(opts, rendererOpts, translationStatus)}
			</body>
		</html>
	`;
};

export const Meta = (dashboard: Dashboard): TemplateResult => html`
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
	<title>${unsafeStatic(dashboard.title)}</title>
	<meta name="description" content="${dashboard.description}" />
	${dashboard.site ? html`<link rel="canonical" href="${dashboard.site}" />` : nothing}
	<meta property="og:title" content="${dashboard.title}" />
	<meta property="og:type" content="website" />
	${dashboard.site ? html`<meta property="og:url" content="${dashboard.site}" />` : nothing}
	<meta property="og:description" content="${dashboard.description}" />
	${Favicon(dashboard)}
`;

export const Favicon = (dashboard: Dashboard): TemplateResult => {
	const { favicon } = dashboard;

	const svg = favicon?.inline ? readAsset(favicon.inline) : '';
	const inlineSvg = 'data:image/svg+xml;utf8,' + svg;

	const ExternalFavicon = favicon?.external
		? html`<link rel="icon" href="${favicon.external.link}" sizes="${favicon.external.sizes}" />`
		: nothing;

	const InlineFavicon = favicon?.inline ? html`<link rel="icon" href="${inlineSvg}" />` : nothing;

	return html`${ExternalFavicon} ${InlineFavicon}`;
};

export const Body = (
	opts: LunariaConfig,
	rendererOpts: LunariaRendererConfig,
	translationStatus: FileTranslationStatus[]
): TemplateResult => {
	const { dashboard } = opts;
	const { slots, overrides } = rendererOpts;

	return html`
		<main>
			<div class="limit-to-viewport">
				${slots.beforeTitle?.(opts) ?? nothing}
				<h1>${dashboard.title}</h1>
				${slots.afterTitle?.(opts) ?? nothing}
				${overrides.statusByLocale?.(opts, translationStatus) ??
				StatusByLocale(opts, translationStatus)}
				${slots.afterStatusByLocale?.(opts) ?? nothing}
			</div>
			${overrides.statusByContent?.(opts, translationStatus) ??
			StatusByContent(opts, translationStatus)}
			${slots.afterStatusByContent?.(opts) ?? nothing}
		</main>
	`;
};

export const StatusByLocale = (
	opts: LunariaConfig,
	translationStatus: FileTranslationStatus[]
): TemplateResult => {
	const { dashboard, locales } = opts;
	return html`
		<h2 id="by-locale">
			<a href="#by-locale">${unsafeStatic(dashboard.ui['statusByLocale.heading'])}</a>
		</h2>
		${locales.map((locale) => LocaleDetails(translationStatus, dashboard, locale))}
	`;
};

export const LocaleDetails = (
	translationStatus: FileTranslationStatus[],
	dashboard: Dashboard,
	locale: Locale
): TemplateResult => {
	const { label, lang } = locale;

	const missingPages = translationStatus.filter((content) => content.translations[lang]?.isMissing);
	const outdatedPages = translationStatus.filter(
		(content) =>
			content.translations[lang]?.isOutdated || !content.translations[lang]?.completeness.complete
	);
	const doneLength = translationStatus.length - outdatedPages.length - missingPages.length;

	return html`
		<details>
			<summary>
				<strong
					>${unsafeStatic(
						getStringFromFormat(dashboard.ui['statusByLocale.detailsTitleFormat'], {
							'{locale_name}': label,
							'{locale_tag}': lang,
						})
					)}</strong
				>
				<br />
				<span class="progress-summary"
					>${unsafeStatic(
						getStringFromFormat(dashboard.ui['statusByLocale.detailsSummaryFormat'], {
							'{done_amount}': doneLength.toString(),
							'{done_word}': dashboard.ui['status.done'],
							'{outdated_amount}': outdatedPages.length.toString(),
							'{outdated_word}': dashboard.ui['status.outdated'],
							'{missing_amount}': missingPages.length.toString(),
							'{missing_word}': dashboard.ui['status.missing'],
						})
					)}</span
				>
				<br />
				${ProgressBar(translationStatus.length, outdatedPages.length, missingPages.length)}
			</summary>
			${outdatedPages.length > 0 ? OutdatedPages(outdatedPages, lang, dashboard) : nothing}
			${missingPages.length > 0
				? html`<h3 class="capitalize">${unsafeStatic(dashboard.ui['status.missing'])}</h3>
						<ul>
							${missingPages.map(
								(page) => html`
									<li>
										${page.gitHostingFileURL
											? Link(page.gitHostingFileURL, getCollapsedPath(dashboard, page.sharedPath))
											: getCollapsedPath(dashboard, page.sharedPath)}
										${page.translations[lang]?.gitHostingFileURL
											? CreatePageLink(
													page.translations[lang]?.gitHostingFileURL!,
													dashboard.ui['statusByLocale.createFileLink']
											  )
											: nothing}
									</li>
								`
							)}
						</ul>`
				: nothing}
			${missingPages.length == 0 && outdatedPages.length == 0
				? html`<p>${unsafeStatic(dashboard.ui['statusByLocale.completeTranslation'])}</p>`
				: nothing}
		</details>
	`;
};

export const OutdatedPages = (
	outdatedPages: FileTranslationStatus[],
	lang: string,
	dashboard: Dashboard
): TemplateResult => {
	return html`
		<h3 class="capitalize">${unsafeStatic(dashboard.ui['status.outdated'])}</h3>
		<ul>
			${outdatedPages.map(
				(page) => html`
					<li>
						${!page.translations[lang]?.completeness.complete
							? html`
									<details>
										<summary>${ContentDetailsLinks(page, lang, dashboard)}</summary>
										${html`
											<h4>${unsafeStatic(dashboard.ui['statusByLocale.missingKeys'])}</h4>
											<ul>
												${page.translations[lang]?.completeness.missingKeys!.map(
													(key) => html`<li>${key}</li>`
												)}
											</ul>
										`}
									</details>
							  `
							: html` ${ContentDetailsLinks(page, lang, dashboard)} `}
					</li>
				`
			)}
		</ul>
	`;
};

export const StatusByContent = (
	opts: LunariaConfig,
	translationStatus: FileTranslationStatus[]
): TemplateResult => {
	const { dashboard, locales } = opts;
	return html`
		<h2 id="by-content">
			<a href="#by-content">${unsafeStatic(dashboard.ui['statusByContent.heading'])}</a>
		</h2>
		<table class="status-by-content">
			<thead>
				<tr>
					${[dashboard.ui['statusByContent.tableRowPage'], ...locales.map(({ lang }) => lang)].map(
						(col) => html`<th>${col}</th>`
					)}
				</tr>
			</thead>
			${TableBody(translationStatus, locales, dashboard)}
		</table>
		<sup class="capitalize"
			>${unsafeStatic(
				getStringFromFormat(dashboard.ui['statusByContent.tableSummaryFormat'], {
					'{missing_emoji}': dashboard.ui['status.emojiMissing'],
					'{missing_word}': dashboard.ui['status.missing'],
					'{outdated_emoji}': dashboard.ui['status.emojiOutdated'],
					'{outdated_word}': dashboard.ui['status.outdated'],
					'{done_emoji}': dashboard.ui['status.emojiDone'],
					'{done_word}': dashboard.ui['status.done'],
				})
			)}
		</sup>
	`;
};

export const TableBody = (
	translationStatus: FileTranslationStatus[],
	locales: Locale[],
	dashboard: Dashboard
): TemplateResult => {
	return html`
		<tbody>
			${translationStatus.map(
				(page) =>
					html`
				<tr>
					<td>${
						page.gitHostingFileURL
							? Link(page.gitHostingFileURL, getCollapsedPath(dashboard, page.sharedPath))
							: getCollapsedPath(dashboard, page.sharedPath)
					}</td>
						${locales.map(({ lang }) => {
							return TableContentStatus(page.translations, lang, dashboard);
						})}
					</td>
				</tr>`
			)}
		</tbody>
	`;
};

export const TableContentStatus = (
	translations: { [locale: string]: TranslationStatus },
	lang: string,
	dashboard: Dashboard
): TemplateResult => {
	return html`
		<td>
			${translations[lang]?.isMissing
				? EmojiFileLink(dashboard.ui, translations[lang]?.gitHostingFileURL!, 'missing')
				: translations[lang]?.isOutdated || !translations[lang]?.completeness.complete
				? EmojiFileLink(dashboard.ui, translations[lang]?.gitHostingFileURL!, 'outdated')
				: EmojiFileLink(dashboard.ui, translations[lang]?.gitHostingFileURL!, 'done')}
		</td>
	`;
};

export const ContentDetailsLinks = (
	page: FileTranslationStatus,
	lang: string,
	dashboard: Dashboard
): TemplateResult => {
	return html`
		${page.gitHostingFileURL
			? Link(page.gitHostingFileURL, getCollapsedPath(dashboard, page.sharedPath))
			: getCollapsedPath(dashboard, page.sharedPath)}
		${page.translations[lang]
			? page.translations[lang]?.gitHostingFileURL || page.translations[lang]?.gitHostingHistoryURL
				? html`(${page.translations[lang]?.gitHostingFileURL
						? Link(
								page.translations[lang]?.gitHostingFileURL!,
								!page.translations[lang]?.completeness.complete
									? dashboard.ui['statusByLocale.incompleteTranslationLink']
									: dashboard.ui['statusByLocale.outdatedTranslationLink']
						  )
						: nothing},
				  ${page.translations[lang]?.gitHostingHistoryURL
						? Link(
								page.translations[lang]?.gitHostingHistoryURL!,
								dashboard.ui['statusByLocale.sourceChangeHistoryLink']
						  )
						: nothing})`
				: nothing
			: nothing}
	`;
};

export const EmojiFileLink = (
	ui: Dashboard['ui'],
	href: string | null,
	status: 'missing' | 'outdated' | 'done'
): TemplateResult => {
	const statusTextOpts = {
		missing: 'status.missing',
		outdated: 'status.outdated',
		done: 'status.done',
	} as const;

	const statusEmojiOpts = {
		missing: 'status.emojiMissing',
		outdated: 'status.emojiOutdated',
		done: 'status.emojiDone',
	} as const;

	return href
		? html`<a href="${href}" title="${ui[statusTextOpts[status]]}">
				<span aria-hidden="true">${ui[statusEmojiOpts[status]]}</span>
		  </a>`
		: html`<span title="${ui[statusTextOpts[status]]}">
				<span aria-hidden="true">${ui[statusEmojiOpts[status]]}</span>
		  </span>`;
};

export const Link = (href: string, text: string): TemplateResult => {
	return html`<a href="${href}">${unsafeStatic(text)}</a>`;
};

export const CreatePageLink = (href: string, text: string): TemplateResult => {
	return html`<a class="create-button" href="${href}">${unsafeStatic(text)}</a>`;
};

export const ProgressBar = (
	total: number,
	outdated: number,
	missing: number,
	{ size = 20 }: { size?: number } = {}
): TemplateResult => {
	const outdatedSize = Math.round((outdated / total) * size);
	const missingSize = Math.round((missing / total) * size);
	const doneSize = size - outdatedSize - missingSize;

	const getBlocks = (size: number, type: 'done' | 'missing' | 'outdated') => {
		const items = [];
		for (let i = 0; i < size; i++) {
			items.push(html`<div class="${type}-bar"></div>`);
		}
		return items;
	};

	return html`
		<div class="progress-bar" aria-hidden="true">
			${getBlocks(doneSize, 'done')} ${getBlocks(outdatedSize, 'outdated')}
			${getBlocks(missingSize, 'missing')}
		</div>
	`;
};
