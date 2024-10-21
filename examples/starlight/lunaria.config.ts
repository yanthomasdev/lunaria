import { defineConfig } from '@lunariajs/core/config';

export default defineConfig({
	repository: {
		name: 'yanthomasdev/lunaria',
		rootDir: 'examples/starlight',
	},
	sourceLocale: 'en',
	locales: ['pt'],
	files: [
		{
			include: ['src/content/docs/**/*.(md|mdx)'],
			exclude: ['src/content/docs/pt/**/*.(md|mdx)'],
			pattern: {
				source: 'src/content/docs/@path',
				locales: 'src/content/docs/@lang/@path',
			},
			type: 'universal',
		},
	],
	tracking: {
		localizableProperty: 'i18nReady',
		ignoredKeywords: [
			'lunaria-ignore',
			'typo',
			'en-only',
			'broken link',
			'i18nReady',
			'i18nIgnore',
		],
	},
	external: true,
});
