import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const site = 'https://lunaria.dev/';

// https://astro.build/config
export default defineConfig({
	site,
	integrations: [
		starlight({
			title: 'Lunaria',
			logo: {
				light: "./src/assets/logo-light.svg",
				dark: "./src/assets/logo-dark.svg",
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
					items: [
						{
							label: 'Getting Started',
							link: 'getting-started',
						},
					],
				},
			],
			customCss: ['./src/styles/theme.css', './src/styles/landing.css'],
		}),
	],
});
