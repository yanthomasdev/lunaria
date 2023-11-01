import { LunariaConfigSchema } from './schemas/config.js';
import run from './tracker.js';
import type { LunariaUserConfig } from './types.js';
import { handleShallowRepo } from './utils/git.js';

export { html } from 'lit-html';
export type * from './types.js';

export async function createTracker(opts: LunariaUserConfig) {
	const parsedConfig = LunariaConfigSchema.safeParse(opts);

	if (!parsedConfig.success) {
		console.error(
			new Error(
				'Invalid configuration options passed to `@lunariajs/core`\n' +
					parsedConfig.error.issues.map((i) => i).join('\n')
			)
		);
		process.exit(1);
	}

	const userConfig = parsedConfig.data;

	const isShallowRepo = await handleShallowRepo(userConfig);

	return {
		run: () => run(userConfig, isShallowRepo),
	};
}
