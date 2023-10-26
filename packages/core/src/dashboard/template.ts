import { html } from 'lit-html';
import { rehype } from 'rehype';
import rehypeFormat from 'rehype-format';
import { Dashboard, FileTranslationStatus, TrackerThingConfig } from '../types';
import { getTextFromFormat, renderToString } from '../utils/misc';
import { defaultStyles } from './styles';

export async function generateDashboardHtml(
	opts: TrackerThingConfig,
	translationStatus: FileTranslationStatus[]
) {
	const html = await rehype()
		.use(rehypeFormat)
		.process(renderToString(Page(opts, translationStatus)));
	return String(html);
}

const Page = (opts: TrackerThingConfig, translationStatus: FileTranslationStatus[]) => {
	const { dashboard } = opts;
	return html`
		<!doctype html>
		<html dir="${dashboard.ui.dir}" lang="${dashboard.ui.lang}">
			<head>
				<!-- Default/custom meta tags -->
				${dashboard.overrides.meta?.(opts) ?? DefaultMeta(dashboard)}
				<!-- Additional head tags -->
				${dashboard.slots.head?.(opts) ?? ''}
				<!-- Styles -->
				${dashboard.overrides.styles?.(opts) ?? defaultStyles}
			</head>
			<body>
				<!-- Default/custom body content -->
				${dashboard.overrides.content?.(opts, translationStatus) ??
				DefaultContent(opts, translationStatus)}
			</body>
		</html>
	`;
};

const DefaultMeta = (dashboard: Dashboard) => html`
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
	<title>${dashboard.title}</title>
	<meta name="description" content="${dashboard.description}" />
	<link rel="canonical" href="${dashboard.url}" />
	<meta property="og:title" content="${dashboard.title}" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="${dashboard.url}" />
	<meta property="og:description" content="${dashboard.description}" />
`;

const DefaultContent = (opts: TrackerThingConfig, translationStatus: FileTranslationStatus[]) => {
	const { dashboard } = opts;
	return html`
		<main>
			<div class="limit-to-viewport">
				${dashboard.slots.beforeTitle?.(opts) ?? ''}
				<h1>${dashboard.title}</h1>
				${dashboard.slots.afterTitle?.(opts) ?? ''}
				${dashboard.overrides.statusByLocale?.(opts, translationStatus) ??
				StatusByLocale(opts, translationStatus)}
			</div>
			${dashboard.overrides.statusByContent?.(opts, translationStatus) ??
			StatusByContent(opts, translationStatus)}
		</main>
	`;
};

const StatusByLocale = (opts: TrackerThingConfig, translationStatus: FileTranslationStatus[]) => {
	const { dashboard, locales } = opts;
	return html`
		<h2 id="by-locale">
			<a href="#by-locale">${dashboard.ui['statusByLocale.heading']}</a>
		</h2>
		${locales.map(({ label, lang }) => {
			const missingPages = translationStatus.filter(
				(content) => content.translations[lang].isMissing
			);
			const outdatedPages = translationStatus.filter(
				(content) =>
					content.translations[lang].isOutdated || !content.translations[lang].completeness.complete
			);
			const doneLength = translationStatus.length - outdatedPages.length - missingPages.length;

			return html`
				<details>
					<summary>
						<strong
							>${getTextFromFormat(dashboard.ui['statusByLocale.detailsTitleFormat'], {
								'{locale_name}': label,
								'{locale_tag}': lang,
							})}</strong
						>
						<br />
						<span class="progress-summary"
							>${getTextFromFormat(dashboard.ui['statusByLocale.detailsSummaryFormat'], {
								'{done_amount}': doneLength.toString(),
								'{done_word}': dashboard.ui['status.done'],
								'{outdated_amount}': outdatedPages.length.toString(),
								'{outdated_word}': dashboard.ui['status.outdated'],
								'{missing_amount}': missingPages.length.toString(),
								'{missing_word}': dashboard.ui['status.missing'],
							})}</span
						>
						<br />
						${ProgressBar(translationStatus.length, outdatedPages.length, missingPages.length)}
					</summary>
					${outdatedPages.length > 0 ? OutdatedPages(outdatedPages, lang, dashboard) : ''}
					<!-- TODO: see if this is rendering correctly -->
					${missingPages.length > 0
						? html`<h3 class="capitalize">${dashboard.ui['status.missing']}</h3>
								<ul>
									${missingPages.map(
										(page) => html`
											<li>${GitHostingLink(page.gitHostingUrl, page.sharedPath)}</li>
										`
									)}
								</ul>`
						: ''}
					${missingPages.length == 0 && outdatedPages.length == 0
						? html`<p>${dashboard.ui['statusByLocale.completeTranslation']}</p>`
						: ''}
				</details>
			`;
		})}
	`;
};

const StatusByContent = (opts: TrackerThingConfig, translationStatus: FileTranslationStatus[]) => {
	const { dashboard, locales } = opts;
	return html`
		<h2 id="by-content">
			<a href="#by-content">${dashboard.ui['statusByContent.heading']}</a>
		</h2>
		<table class="status-by-content">
			<thead>
				<tr>
					${[dashboard.ui['statusByContent.tableRowPage'], ...locales.map(({ lang }) => lang)].map(
						(col) => html`<th>${col}</th>`
					)}
				</tr>
			</thead>
			<tbody>
				${translationStatus.map(
					(page) => html`
						<tr>
							<td>${GitHostingLink(page.gitHostingUrl, page.sharedPath)}</td>
							<td>
								${Object.keys(page.translations).map(
									(lang) => html`
										${page.translations[lang].isMissing
											? html`<span title="${dashboard.ui['status.missing']}"
													><span aria-hidden="true"
														>${dashboard.ui['status.emojiMissing']}</span
													></span
											  >`
											: page.translations[lang].isOutdated ||
											  !page.translations[lang].completeness.complete
											? html`<a
													href="${page.translations[lang].gitHostingUrl}"
													title="${dashboard.ui['status.outdated']}"
													><span aria-hidden="true"
														>${dashboard.ui['status.emojiOutdated']}</span
													></a
											  >`
											: html`<a
													href="${page.translations[lang].gitHostingUrl}"
													title="${dashboard.ui['status.done']}"
													><span aria-hidden="true">${dashboard.ui['status.emojiDone']}</span></a
											  >`}
									`
								)}
							</td>
						</tr>
					`
				)}
			</tbody>
		</table>
		<sup class="capitalize"
			>${getTextFromFormat(dashboard.ui['statusByContent.tableSummaryFormat'], {
				'{missing_emoji}': dashboard.ui['status.emojiMissing'],
				'{missing_word}': dashboard.ui['status.missing'],
				'{outdated_emoji}': dashboard.ui['status.emojiOutdated'],
				'{outdated_word}': dashboard.ui['status.outdated'],
				'{done_emoji}': dashboard.ui['status.emojiDone'],
				'{done_word}': dashboard.ui['status.done'],
			})}</sup
		>
	`;
};

const OutdatedPages = (
	outdatedPages: FileTranslationStatus[],
	lang: string,
	dashboard: Dashboard
) =>
	html`<h3 class="capitalize">${dashboard.ui['status.outdated']}</h3>
		<ul>
			${outdatedPages.map(
				(page) => html`
					<li>
						${!page.translations[lang].completeness.complete
							? html`
									<details>
										<summary>${ContentDetailsLinks(page, lang, dashboard)}</summary>
										${html`
											<h4>${dashboard.ui['statusByLocale.missingKeys']}</h4>
											<ul>
												${page.translations[lang].completeness.missingKeys!.map(
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
		</ul> `;

const ContentDetailsLinks = (
	page: FileTranslationStatus,
	lang: string,
	dashboard: Dashboard
) => html`
	${GitHostingLink(page.gitHostingUrl, page.sharedPath)}
	(${GitHostingLink(
		page.translations[lang].gitHostingUrl,
		!page.translations[lang].completeness.complete
			? dashboard.ui['statusByLocale.incompleteTranslationLink']
			: dashboard.ui['statusByLocale.outdatedTranslationLink']
	)},
	${GitHostingLink(
		page.translations[lang].sourceHistoryUrl,
		dashboard.ui['statusByLocale.sourceChangeHistoryLink']
	)})
`;

// TODO: See if this needs to be escaped
const GitHostingLink = (href: string, text: string) => {
	return html`<a href="${href}">${text}</a>`;
};

const ProgressBar = (
	total: number,
	outdated: number,
	missing: number,
	{ size = 20 }: { size?: number } = {}
) => {
	const outdatedBlocks = Math.round((outdated / total) * size);
	const missingBlocks = Math.round((missing / total) * size);
	const doneBlocks = size - outdatedBlocks - missingBlocks;
	return html`
		<span class="progress-bar" aria-hidden="true">
			${[
				[doneBlocks, '🟪'],
				[outdatedBlocks, '🟧'],
				[missingBlocks, '⬜'],
			]
				.map(([length, icon]) => Array(length).fill(icon))
				.flat()
				.join('')}
		</span>
	`;
};
