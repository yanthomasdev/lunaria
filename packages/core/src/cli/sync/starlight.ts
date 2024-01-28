import type { LunariaUserConfig } from '../../config/index.js';
import { updateConfig } from './index.js';

export async function starlight(configPath: string, skipQuestions: boolean) {
	const file: LunariaUserConfig['files'][number] = {
		location: 'src/content/docs/**/*.{md,mdx}',
		pattern: 'src/content/docs/@lang/@path',
		type: 'universal',
	};

	await updateConfig(configPath, undefined, undefined, file, skipQuestions);
}
