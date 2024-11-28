import type { CompleteLunariaUserConfig } from '../dist/integrations/types.js';

export const sampleValidConfig: CompleteLunariaUserConfig = {
	repository: {
		name: 'yanthomasdev/lunaria',
	},
	sourceLocale: {
		label: 'English',
		lang: 'en',
	},
	locales: [
		{
			label: 'Spanish',
			lang: 'es',
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
