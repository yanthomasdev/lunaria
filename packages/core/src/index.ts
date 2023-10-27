import run from './tracker';
import { LunariaConfigSchema, LunariaUserConfig } from './utils/config';
import { handleShallowRepo } from './utils/git';

export type {
	Dashboard,
	FileData,
	FileTranslationStatus,
	Locale,
	LunariaConfig,
	SharedPathResolver,
} from './types';

export { html } from 'lit-html';

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
