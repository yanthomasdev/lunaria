import type { LunariaUserConfig } from '../dist/index.js';
import type { CompleteLunariaUserConfig } from '../dist/integrations/types.js';

export const sampleValidConfig: CompleteLunariaUserConfig = {
	repository: {
		name: 'yanthomasdev/lunaria',
	},
	sourceLocale: 'en',
	locales: ['es'],
	files: [
		{
			include: ['src/content/**/*.mdx'],
			pattern: 'src/content/@lang/@path',
			type: 'universal',
		},
	],
};
