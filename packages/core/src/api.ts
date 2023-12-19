import { fromZodError } from 'zod-validation-error';
import { errorOpts } from './constants.js';
import { LunariaConfigSchema } from './schemas/config.js';
import { getContentIndex, getTranslationStatus } from './tracker.js';
import type { LunariaUserConfig, LunariaUserRendererConfig } from './types.js';
import { handleShallowRepo } from './utils/git.js';

export async function lunaria(opts: LunariaUserConfig) {
	const parsedConfig = LunariaConfigSchema.safeParse(opts);

	if (!parsedConfig.success) {
		const validationError = fromZodError(parsedConfig.error, errorOpts);

		console.error(
			new Error('Invalid configuration options passed to `@lunariajs/core`:\n' + validationError)
		);

		return null;
	}

	const userConfig = parsedConfig.data;

	const isShallowRepo = await handleShallowRepo(userConfig);
	const contentIndex = await getContentIndex(userConfig, isShallowRepo);
	const translationStatus = await getTranslationStatus(userConfig, contentIndex);

	return translationStatus;
}

export function defineRendererConfig(opts: LunariaUserRendererConfig) {
	return opts;
}
