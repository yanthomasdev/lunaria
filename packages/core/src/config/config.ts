import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ConfigNotFound, ConfigValidationError } from '../errors/errors.js';
import { moduleLoader } from '../files/loaders.js';
import { LunariaPreSetupSchema } from '../integrations/schema.js';
import type { CompleteLunariaUserConfig } from '../integrations/types.js';
import { parseWithFriendlyErrors } from '../utils/utils.js';
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
function findConfig() {
	for (const path of configPaths) {
		if (existsSync(resolve(path))) {
			return path;
		}
	}

	return new Error(ConfigNotFound.message);
}

/** Loads a CJS/ESM `lunaria.config.*` file from the root of the current working directory. */
export function loadConfig() {
	const path = findConfig();
	if (path instanceof Error) {
		throw path;
	}

	const mod = moduleLoader(path);
	if (mod instanceof Error) {
		throw mod;
	}

	return validateInitialConfig(mod);
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
