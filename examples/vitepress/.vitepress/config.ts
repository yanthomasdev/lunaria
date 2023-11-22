import { defineConfig } from 'vitepress';

export default defineConfig({
	locales: {
		en: {
			label: 'English',
			lang: 'en',
			link: '/en/',
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
