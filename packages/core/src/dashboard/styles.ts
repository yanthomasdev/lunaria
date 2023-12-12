import { html } from 'lit-html';

export const Styles = html`
	<style>
		:root {
			/** Fonts */
			--font-fallback: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif,
				Apple Color Emoji, Segoe UI Emoji;
			--font-body: system-ui, var(--font-fallback);
			--font-mono: 'IBM Plex Mono', Consolas, 'Andale Mono WT', 'Andale Mono', 'Lucida Console',
				'Lucida Sans Typewriter', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Liberation Mono',
				'Nimbus Mono L', Monaco, 'Courier New', Courier, monospace;

			/** Base Colors */
			--light-black: #292524;
			--dark-black: #1c1917;
			--light-white: #fafaf9;
			--dark-white: #e7e5e4;
			--light-accent: #8b5cf6;
			--dark-accent: #6d28d9;
			--light-blue: #60a5fa;
			--dark-blue: #3b82f6;

			/** Contextual Colors */
			--background: var(--light-white);
			--text: var(--dark-black);
			--table-head-color: var(--light-white);
			--link: var(--dark-blue);
			--hover: var(--dark-accent);
			--table-head-background: var(--dark-accent);
			--table-background: var(--dark-white);
			--table-border: var(--dark-accent);
			--done-bar: #a855f7;
			--outdated-bar: #f97316;
			--missing-bar: #9ca3af;
		}

		@media (prefers-color-scheme: dark) {
			:root {
				--background: var(--dark-black);
				--text: var(--dark-white);
				--link: var(--light-blue);
				--hover: var(--light-accent);
				--table-head-background: var(--light-accent);
				--table-background: var(--light-black);
				--table-border: var(--light-accent);
				--missing-bar: #f9fafb;
			}
		}

		* {
			box-sizing: border-box;
			margin: 0;
		}

		html {
			background: var(--background);
			scrollbar-gutter: stable;
		}

		body {
			color: var(--text);
			display: flex;
			flex-direction: column;
			font-family: var(--font-body);
			font-size: 16px;
			line-height: 1.5;
			margin-block: 2rem;
			margin-inline: 1rem;
		}

		h1,
		h2,
		h3,
		h4,
		h5,
		h6 {
			margin-bottom: 1rem;
			font-weight: bold;
			line-height: 1.3;
		}

		h1,
		h2 {
			max-width: 40ch;
		}

		h1 {
			font-size: 2.25rem;
			font-weight: 900;
		}

		h2 {
			font-size: 1.875rem;
			margin-top: 4rem;
		}

		h3,
		h4 {
			margin-top: 3rem;
		}

		h5,
		h6 {
			margin-top: 2rem;
		}

		main {
			max-width: 80ch;
			margin-inline: auto;
		}

		.limit-to-viewport {
			max-width: calc(100vw - 2rem);
		}

		p + p {
			margin-top: 1.25rem;
		}

		a {
			color: var(--link);
			text-decoration: none;
		}

		h2 a {
			color: inherit;
		}

		a:hover {
			text-decoration: underline;
		}

		ul {
			font-size: 0.875rem;
		}

		details {
			margin-bottom: 1.25rem;
		}

		details summary {
			cursor: pointer;
			user-select: none;
		}

		details summary:hover strong {
			color: var(--hover);
		}

		details h3 {
			margin-top: 1.2rem;
			font-size: 0.8rem;
		}

		details h4 {
			margin-top: 1rem;
			font-size: 0.8rem;
		}

		details > :last-child {
			margin-bottom: 1rem;
		}

		.create-button {
			padding: 0.1em 0.5em;
			background-color: hsl(213deg 89% 64% / 20%);
			display: inline-block;
			border-radius: 0.5em;
			font-weight: bold;
			font-size: 0.75rem;
		}

		.status-by-content {
			margin-bottom: 1rem;
			border-collapse: collapse;
			border: 1px solid var(--table-border);
			font-size: 0.8125rem;
			column-gap: 64px;
		}

		.status-by-content tr:first-of-type td {
			padding-top: 0.5rem;
		}

		.status-by-content tr td:first-of-type {
			padding-inline: 1rem;
		}

		.status-by-content th {
			position: sticky;
			top: -1px;
			background: var(--table-head-background);
			color: var(--table-head-color);
			white-space: nowrap;
			padding-inline: 0.3rem;
		}

		.status-by-content th,
		.status-by-content td {
			padding-block: 0.2rem;
		}

		.status-by-content tbody tr:hover td {
			background: var(--table-background);
		}

		.status-by-content .spacer td {
			height: 0.5rem;
		}

		.status-by-content th:first-of-type,
		.status-by-content td:first-of-type {
			text-align: left;
			padding-inline-start: 1rem;
		}

		.status-by-content th:last-of-type,
		.status-by-content td:last-of-type {
			text-align: center;
			padding-inline-end: 1rem;
		}

		.status-by-content td:not(:first-of-type) {
			min-width: 2rem;
			text-align: center;
			cursor: default;
		}

		.status-by-content td:not(:first-of-type) a {
			text-decoration: none;
		}

		.progress-summary {
			font-size: 0.8125rem;
		}

		.progress-bar {
			display: flex;
			flex-direction: row;
			margin-top: 0.5rem;
		}

		.progress-bar div:first-of-type {
			border-radius: 36px 0px 0px 36px;
		}

		.progress-bar div:last-of-type {
			border-radius: 0px 36px 36px 0px;
		}

		.done-bar,
		.outdated-bar,
		.missing-bar {
			width: 1rem;
			height: 1rem;
		}

		.done-bar {
			background-color: var(--done-bar);
		}

		.outdated-bar {
			background-color: var(--outdated-bar);
		}

		.missing-bar {
			background-color: var(--missing-bar);
		}

		.capitalize {
			text-transform: capitalize;
		}
	</style>
`;
