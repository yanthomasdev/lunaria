import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Tracker Thing',
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
