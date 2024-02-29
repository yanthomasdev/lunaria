import { loadConfig } from '../../config/index.js';
import { handleShallowRepo } from '../../status/git.js';
import { getLocalizationStatus } from '../../status/index.js';
import type { StdoutOptions } from '../types.js';

export async function stdout(options: StdoutOptions) {
	/** Command options */
	const configPath = options.config ?? './lunaria.config.json';

	const { userConfig } = await loadConfig(configPath);

	const isShallowRepo = await handleShallowRepo(userConfig);
	const status = await getLocalizationStatus(userConfig, isShallowRepo);

	console.log(JSON.stringify([userConfig, status]));
}
