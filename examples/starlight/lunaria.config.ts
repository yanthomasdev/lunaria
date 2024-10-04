import { defineConfig } from '@lunariajs/core/config';

export default defineConfig({
	repository: 'yanthomasdev/lunaria',
	//sourceLocale: {
	//	label: 'English',
	//	lang: 'en',
	//},
	//locales: [
	//	{
	//		lang: 'pt',
	//		label: 'Português',
	//	},
	//],
	tracking: {
		ignoredKeywords: ['TEST'],
	},
	//files: [
	//	{
	//		include: ['src/content/docs/**/*.(md|mdx)'],
	//		exclude: ['src/content/docs/pt/**/*.(md|mdx)'],
	//		pattern: {
	//			source: 'src/content/docs/@path',
	//			locales: 'src/content/docs/@lang/@path',
	//		},
	//		type: 'universal',
	//	},
	//],
	integrations: [],
});
