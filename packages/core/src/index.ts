import run from './tracker';
import { TrackerThingConfigSchema, TrackerThingUserConfig } from './utils/config';
import { handleShallowRepo } from './utils/git';

export type {
	Dashboard,
	FileData,
	FileTranslationStatus,
	Locale,
	SharedPathResolver,
	TrackerThingConfig,
} from './types';

export { html } from 'lit-html';

export async function createTracker(opts: TrackerThingUserConfig) {
	const parsedConfig = TrackerThingConfigSchema.safeParse(opts);

	if (!parsedConfig.success) {
		console.error(
			new Error(
				'Invalid configuration options passed to `@tracker-thing/core`\n' +
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
