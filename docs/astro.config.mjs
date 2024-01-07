import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

const site = 'https://lunaria.dev/';

export const locales = {
	root: { label: 'English', lang: 'en' },
	fr: { label: 'Français', lang: 'fr' },
}

// https://astro.build/config
export default defineConfig({
	site,
	integrations: [
		starlight({
			title: 'Lunaria',
			locales,
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
				replacesTitle: true,
			},
			social: {
				github: 'https://github.com/Yan-Thomas/lunaria',
			},
			editLink: {
				baseUrl: 'https://github.com/Yan-Thomas/lunaria/edit/main/docs/',
			},
			head: [
				{
					tag: 'meta',
					attrs: { property: 'og:image', content: site + 'og.jpg?v=1' },
				},
				{
					tag: 'meta',
					attrs: { property: 'twitter:image', content: site + 'og.jpg?v=1' },
				},
			],
			sidebar: [
				{
					label: 'Start Here',
					translations: {
						fr: 'Commencer ici',
					},
					items: [
						{
							label: 'Getting Started',
							link: 'getting-started',
							translations: {
								fr: 'Bien démarrer',
							}
						},
						{
							label: 'Manual Installation',
							link: 'manual-installation',
							translations: {
								fr: 'Installation manuelle',
							}
						},
						/*{
							label: 'Workflow',
							link: 'workflow',
						},*/
					],
				},
				/*{
					label: 'Features',
					items: [
						{
							label: 'Tracking',
							link: 'features/tracking',
						},
					],
				},*/
			],
			customCss: ['./src/styles/theme.css', './src/styles/landing.css'],
		}),
	],
});
