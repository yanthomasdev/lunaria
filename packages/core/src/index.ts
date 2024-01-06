import { validateConfig } from './config/index.js';
import { handleShallowRepo } from './status/git.js';
import { getLocalizationStatus } from './status/index.js';
import type { LunariaUserConfig, LunariaUserRendererConfig } from './types.js';

export { html } from './dashboard/index.js';
export type * from './types.js';

/**
 * Returns Lunaria's localization status for your project according to the specified configuration.
 */
export async function lunaria(config: LunariaUserConfig) {
	const userConfig = validateConfig(config);
	const isShallowRepo = await handleShallowRepo(userConfig);

	return await getLocalizationStatus(userConfig, isShallowRepo);
}

/**
 * Wrapper function around your configuration, use it to provide automatic type hints in your IDE.
 */
export function defineRendererConfig(config: LunariaUserRendererConfig): LunariaUserRendererConfig {
	return config;
}
