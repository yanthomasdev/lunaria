import { TrackerThingConfigSchema, TrackerThingUserConfig } from './utils/config';

export function createTracker(opts: TrackerThingUserConfig) {
	const parsedConfig = TrackerThingConfigSchema.safeParse(opts);

	if (!parsedConfig.success) {
		throw new Error(
			'Invalid configuration options passed to `@tracker-thing/core`\n' +
				parsedConfig.error.issues.map((i) => i).join('\n')
		);
	}

	const userConfig = parsedConfig.data;

	console.log(userConfig);
}
