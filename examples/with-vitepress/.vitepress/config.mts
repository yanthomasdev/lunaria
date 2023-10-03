import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'Tracker Thing + VitePress',
	description: 'A Tracker Thing + VitePress example',
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [{ text: 'Home', link: '/' }],

		sidebar: [
			{
				text: 'Examples',
				items: [
					{ text: 'First page', link: '/first-page' },
					{ text: 'Second page', link: '/second-page' },
				],
			},
		],
	},
	locales: {
		root: {
			label: 'English',
			lang: 'en',
		},
		pt: {
			label: 'Português',
			lang: 'pt',
			themeConfig: {
				nav: [{ text: 'Início', link: '/pt/' }],
				sidebar: [
					{
						text: 'Exemplos',
						items: [
							{ text: 'Primeira página', link: '/pt/first-page' },
							{ text: 'Segunda página', link: '/pt/second-page' },
						],
					},
				],
			},
		},
	},
});
