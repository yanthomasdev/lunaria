import type { LunariaUserConfig } from '../dist/types.js';

export const sampleValidConfig: LunariaUserConfig = {
	repository: 'yanthomasdev/lunaria',
	sourceLocale: {
		lang: 'en',
		label: 'English',
	},
	locales: [
		{
			lang: 'es',
			label: 'Spanish',
		},
	],
	files: [
		{
			include: ['src/content/**/*.mdx'],
			pattern: 'src/content/@lang/@path',
			type: 'universal',
		},
	],
};
