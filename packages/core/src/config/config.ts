import { resolve } from 'node:path';
import { ConfigNotFound, ConfigValidationError } from '../errors/errors.js';
import { loadModule } from '../files/loaders.js';
import { LunariaPreSetupSchema } from '../integrations/schema.js';
import type { CompleteLunariaUserConfig } from '../integrations/types.js';
import { exists, parseWithFriendlyErrors } from '../utils/utils.js';
import { LunariaConfigSchema } from './schema.js';
import type { LunariaUserConfig } from './types.js';

/**
 * Paths to search for the Lunaria config file,
 * sorted by how likely they're to appear.
 */
const configPaths = Object.freeze([
	'lunaria.config.mjs',
	'lunaria.config.js',
	'lunaria.config.ts',
	'lunaria.config.mts',
	'lunaria.config.cjs',
	'lunaria.config.cts',
]);

/** Finds the first `lunaria.config.*` file in the current working directoy and return its path.  */
async function findConfig() {
	for (const path of configPaths) {
		if (await exists(resolve(path))) {
			return path;
		}
	}

	return new Error(ConfigNotFound.message);
}

/** Loads a CJS/ESM `lunaria.config.*` file from the root of the current working directory. */
export async function loadConfig() {
	const path = await findConfig();
	if (path instanceof Error) {
		throw path;
	}

	const mod = await loadModule(path);
	if (mod instanceof Error) {
		throw mod;
	}

	return validateInitialConfig(mod as LunariaUserConfig);
}

/** Validates the Lunaria config before the integrations' setup hook have run. */
export function validateInitialConfig(config: LunariaUserConfig) {
	return parseWithFriendlyErrors(LunariaPreSetupSchema, config, (issues) =>
		ConfigValidationError.message(issues),
	);
}

/** Validates the Lunaria config after all the integrations' setup hook have run. */
export function validateFinalConfig(config: CompleteLunariaUserConfig) {
	return parseWithFriendlyErrors(LunariaConfigSchema, config, (issues) =>
		ConfigValidationError.message(issues),
	);
}
