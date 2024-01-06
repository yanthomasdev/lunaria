import type {
	Dashboard,
	FileStatus,
	Locale,
	LocalizationStatus,
	LunariaConfig,
	LunariaRendererConfig,
	Status,
} from '../types.js';
import { getStringFromFormat } from '../utils.js';
import { getCollapsedPath, inlineCustomCssFiles, readAsset } from './helpers.js';
import { html } from './index.js';
import { Styles } from './styles.js';

export const Page = (
	config: LunariaConfig,
	rendererConfig: LunariaRendererConfig | undefined,
	status: LocalizationStatus[]
): string => {
	const { dashboard } = config;

	const inlinedCssFiles = inlineCustomCssFiles(dashboard.customCss);

	return html`
		<!doctype html>
		<html dir="${dashboard.ui.dir}" lang="${dashboard.ui.lang}">
			<head>
				<!-- Built-in/custom meta tags -->
				${rendererConfig?.overrides.meta?.(config) ?? Meta(dashboard)}
				<!-- Additional head tags -->
				${rendererConfig?.slots.head?.(config) ?? ''}
				<!-- Built-in styles -->
				${Styles}
				<!-- Custom styles -->
				${inlinedCssFiles?.map(
					(css) =>
						html`<style>
							${css}
						</style>`
				) ?? ''}
			</head>
			<body>
				<!-- Built-in/custom body content -->
				${rendererConfig?.overrides.body?.(config, status) ?? Body(config, rendererConfig, status)}
			</body>
		</html>
	`;
};

export const Meta = (dashboard: Dashboard): string => html`
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
	<title>${dashboard.title}</title>
	<meta name="description" content="${dashboard.description}" />
	${dashboard.site ? html`<link rel="canonical" href="${dashboard.site}" />` : ''}
	<meta property="og:title" content="${dashboard.title}" />
	<meta property="og:type" content="website" />
	${dashboard.site ? html`<meta property="og:url" content="${dashboard.site}" />` : ''}
	<meta property="og:description" content="${dashboard.description}" />
	${Favicon(dashboard)}
`;

export const Favicon = (dashboard: Dashboard): string => {
	const { favicon } = dashboard;

	const svg = favicon?.inline ? readAsset(favicon.inline) : '';
	const inlineSvg = 'data:image/svg+xml;utf8,' + svg;

	const ExternalFavicon = favicon?.external
		? html`${favicon.external.map(
				(icon) => html`<link rel="icon" href="${icon.link}" type="${icon.type}" />`
		  )}`
		: '';

	const InlineFavicon = favicon?.inline ? html`<link rel="icon" href="${inlineSvg}" />` : '';

	return html`${ExternalFavicon} ${InlineFavicon}`;
};

export const Body = (
	config: LunariaConfig,
	rendererConfig: LunariaRendererConfig | undefined,
	status: LocalizationStatus[]
): string => {
	const { dashboard } = config;

	return html`
		<main>
			<div class="limit-to-viewport">
				${rendererConfig?.slots.beforeTitle?.(config) ?? ''}
				<h1>${dashboard.title}</h1>
				${rendererConfig?.slots.afterTitle?.(config) ?? ''}
				${rendererConfig?.overrides.statusByLocale?.(config, status) ??
				StatusByLocale(config, status)}
				${rendererConfig?.slots.afterStatusByLocale?.(config) ?? ''}
			</div>
			${rendererConfig?.overrides.statusByFile?.(config, status) ?? StatusByFile(config, status)}
			${rendererConfig?.slots.afterStatusByFile?.(config) ?? ''}
		</main>
	`;
};

export const StatusByLocale = (config: LunariaConfig, status: LocalizationStatus[]): string => {
	const { dashboard, locales } = config;
	return html`
		<h2 id="by-locale">
			<a href="#by-locale">${dashboard.ui['statusByLocale.heading']}</a>
		</h2>
		${locales.map((locale) => LocaleDetails(status, dashboard, locale))}
	`;
};

export const LocaleDetails = (
	status: LocalizationStatus[],
	dashboard: Dashboard,
	locale: Locale
): string => {
	const { label, lang } = locale;

	const missingFiles = status.filter((content) => content.localizations[lang]?.isMissing);
	const outdatedFiles = status.filter(
		(content) =>
			content.localizations[lang]?.isOutdated || !content.localizations[lang]?.completeness.complete
	);
	const doneLength = status.length - outdatedFiles.length - missingFiles.length;

	return html`
		<details class="progress-details">
			<summary>
				<strong
					>${getStringFromFormat(dashboard.ui['statusByLocale.detailsTitleFormat'], {
						'{locale_name}': label,
						'{locale_tag}': lang,
					})}</strong
				>
				<br />
				<span class="progress-summary"
					>${getStringFromFormat(dashboard.ui['statusByLocale.detailsSummaryFormat'], {
						'{done_amount}': doneLength.toString(),
						'{done_word}': dashboard.ui['status.done'],
						'{outdated_amount}': outdatedFiles.length.toString(),
						'{outdated_word}': dashboard.ui['status.outdated'],
						'{missing_amount}': missingFiles.length.toString(),
						'{missing_word}': dashboard.ui['status.missing'],
					})}</span
				>
				<br />
				${ProgressBar(status.length, outdatedFiles.length, missingFiles.length)}
			</summary>
			${outdatedFiles.length > 0 ? OutdatedFiles(outdatedFiles, lang, dashboard) : ''}
			${missingFiles.length > 0
				? html`<h3 class="capitalize">${dashboard.ui['status.missing']}</h3>
						<ul>
							${missingFiles.map(
								(file) => html`
									<li>
										${file.gitHostingFileURL
											? Link(file.gitHostingFileURL, getCollapsedPath(dashboard, file.sharedPath))
											: getCollapsedPath(dashboard, file.sharedPath)}
										${file.localizations[lang]?.gitHostingFileURL
											? CreateFileLink(
													file.localizations[lang]?.gitHostingFileURL!,
													dashboard.ui['statusByLocale.createFileLink']
											  )
											: ''}
									</li>
								`
							)}
						</ul>`
				: ''}
			${missingFiles.length == 0 && outdatedFiles.length == 0
				? html`<p>${dashboard.ui['statusByLocale.completeLocalization']}</p>`
				: ''}
		</details>
	`;
};

export const OutdatedFiles = (
	outdatedFiles: LocalizationStatus[],
	lang: string,
	dashboard: Dashboard
): string => {
	return html`
		<h3 class="capitalize">${dashboard.ui['status.outdated']}</h3>
		<ul>
			${outdatedFiles.map(
				(file) => html`
					<li>
						${!file.localizations[lang]?.completeness.complete
							? html`
									<details>
										<summary>${ContentDetailsLinks(file, lang, dashboard)}</summary>
										${html`
											<h4>${dashboard.ui['statusByLocale.missingKeys']}</h4>
											<ul>
												${file.localizations[lang]?.completeness.missingKeys!.map(
													(key) => html`<li>${key}</li>`
												) ?? ''}
											</ul>
										`}
									</details>
							  `
							: html` ${ContentDetailsLinks(file, lang, dashboard)} `}
					</li>
				`
			)}
		</ul>
	`;
};

export const StatusByFile = (config: LunariaConfig, status: LocalizationStatus[]): string => {
	const { dashboard, locales } = config;
	return html`
		<h2 id="by-file">
			<a href="#by-file">${dashboard.ui['statusByFile.heading']}</a>
		</h2>
		<table class="status-by-file">
			<thead>
				<tr>
					${[dashboard.ui['statusByFile.tableRowFile'], ...locales.map(({ lang }) => lang)].map(
						(col) => html`<th>${col}</th>`
					)}
				</tr>
			</thead>
			${TableBody(status, locales, dashboard)}
		</table>
		<sup class="capitalize"
			>${getStringFromFormat(dashboard.ui['statusByFile.tableSummaryFormat'], {
				'{missing_emoji}': dashboard.ui['status.emojiMissing'],
				'{missing_word}': dashboard.ui['status.missing'],
				'{outdated_emoji}': dashboard.ui['status.emojiOutdated'],
				'{outdated_word}': dashboard.ui['status.outdated'],
				'{done_emoji}': dashboard.ui['status.emojiDone'],
				'{done_word}': dashboard.ui['status.done'],
			})}
		</sup>
	`;
};

export const TableBody = (
	status: LocalizationStatus[],
	locales: Locale[],
	dashboard: Dashboard
): string => {
	return html`
		<tbody>
			${status.map(
				(file) =>
					html`
				<tr>
					<td>${
						file.gitHostingFileURL
							? Link(file.gitHostingFileURL, getCollapsedPath(dashboard, file.sharedPath))
							: getCollapsedPath(dashboard, file.sharedPath)
					}</td>
						${locales.map(({ lang }) => {
							return TableContentStatus(file.localizations, lang, dashboard);
						})}
					</td>
				</tr>`
			)}
		</tbody>
	`;
};

export const TableContentStatus = (
	localizations: { [locale: string]: FileStatus },
	lang: string,
	dashboard: Dashboard
): string => {
	return html`
		<td>
			${localizations[lang]?.isMissing
				? EmojiFileLink(dashboard.ui, localizations[lang]?.gitHostingFileURL!, 'missing')
				: localizations[lang]?.isOutdated || !localizations[lang]?.completeness.complete
				? EmojiFileLink(dashboard.ui, localizations[lang]?.gitHostingFileURL!, 'outdated')
				: EmojiFileLink(dashboard.ui, localizations[lang]?.gitHostingFileURL!, 'done')}
		</td>
	`;
};

export const ContentDetailsLinks = (
	fileStatus: LocalizationStatus,
	lang: string,
	dashboard: Dashboard
): string => {
	return html`
		${fileStatus.gitHostingFileURL
			? Link(fileStatus.gitHostingFileURL, getCollapsedPath(dashboard, fileStatus.sharedPath))
			: getCollapsedPath(dashboard, fileStatus.sharedPath)}
		${fileStatus.localizations[lang]
			? fileStatus.localizations[lang]?.gitHostingFileURL ||
			  fileStatus.localizations[lang]?.gitHostingHistoryURL
				? html`(${fileStatus.localizations[lang]?.gitHostingFileURL
						? Link(
								fileStatus.localizations[lang]?.gitHostingFileURL!,
								!fileStatus.localizations[lang]?.completeness.complete
									? dashboard.ui['statusByLocale.incompleteLocalizationLink']
									: dashboard.ui['statusByLocale.outdatedLocalizationLink']
						  )
						: ''},
				  ${fileStatus.localizations[lang]?.gitHostingHistoryURL
						? Link(
								fileStatus.localizations[lang]?.gitHostingHistoryURL!,
								dashboard.ui['statusByLocale.sourceChangeHistoryLink']
						  )
						: ''})`
				: ''
			: ''}
	`;
};

export const EmojiFileLink = (ui: Dashboard['ui'], href: string | null, type: Status): string => {
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
		? html`<a href="${href}" title="${ui[statusTextOpts[type]]}">
				<span aria-hidden="true">${ui[statusEmojiOpts[type]]}</span>
		  </a>`
		: html`<span title="${ui[statusTextOpts[type]]}">
				<span aria-hidden="true">${ui[statusEmojiOpts[type]]}</span>
		  </span>`;
};

export const Link = (href: string, text: string): string => {
	return html`<a href="${href}">${text}</a>`;
};

export const CreateFileLink = (href: string, text: string): string => {
	return html`<a class="create-button" href="${href}">${text}</a>`;
};

export const ProgressBar = (
	total: number,
	outdated: number,
	missing: number,
	{ size = 20 }: { size?: number } = {}
): string => {
	const outdatedSize = Math.round((outdated / total) * size);
	const missingSize = Math.round((missing / total) * size);
	const doneSize = size - outdatedSize - missingSize;

	const getBlocks = (size: number, type: Status) => {
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
