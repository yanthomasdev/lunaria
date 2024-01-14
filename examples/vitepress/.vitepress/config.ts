import { defineConfig } from 'vitepress';

export default defineConfig({
	locales: {
		root: {
			label: 'English',
			lang: 'en',
		},
		pt: {
			label: 'Português',
			lang: 'pt',
			link: '/pt/',
		},
		es: {
			label: 'Spanish',
			lang: 'es',
			link: '/es/',
		},
	},
});
