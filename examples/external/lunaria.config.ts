import { defineConfig } from '@lunariajs/core/config';

export default defineConfig({
	repository: {
		name: 'withastro/docs',
	},
	sourceLocale: 'en',
	locales: ['ar', 'de', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'pl', 'pt-br', 'ru', 'zh-cn', 'zh-tw'],
	files: [
		{
			include: ['src/i18n/en/(ui|docsearch).ts'],
			pattern: 'src/i18n/@lang/@path',
			type: 'dictionary',
		},
		{
			include: ['src/i18n/en/nav.ts'],
			pattern: 'src/i18n/@lang/@path',
			type: 'universal',
		},
		{
			include: ['src/content/docs/en/**/*.(md|mdx)'],
			pattern: 'src/content/docs/@lang/@path',
			type: 'universal',
		},
	],
	external: true,
	tracking: {
		localizableProperty: 'i18nReady',
	},
});
