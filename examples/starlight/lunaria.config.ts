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
});
