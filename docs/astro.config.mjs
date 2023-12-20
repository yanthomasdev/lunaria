import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export const locales = {
	root: { label: 'English', lang: 'en' },
	es: { label: 'Español', lang: 'es' },
}

const site = 'https://lunaria.dev/';

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
					items: [
						{
							label: 'Getting Started',
							link: '/es/getting-started',
						},
						{
							label: 'Manual Installation',
							link: '/es/manual-installation',
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
				{
					label: 'Empieza aquí',
					items: [
						{
							label: 'Empezar',
							link: '/es/getting-started',
						},
						{
							label: 'Instalación manual',
							link: '/es/manual-installation',
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
