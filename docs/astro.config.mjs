import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://lunaria.dev',
	integrations: [
		starlight({
			title: 'Lunaria',
			social: {
				github: 'https://github.com/Yan-Thomas/lunaria',
			},
			editLink: {
				baseUrl: 'https://github.com/Yan-Thomas/lunaria/edit/main/docs/',
			},
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
		}),
	],
});
