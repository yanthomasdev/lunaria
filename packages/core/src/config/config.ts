import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ConfigNotFound } from '../errors/errors.js';
import { parseWithFriendlyErrors } from '../errors/index.js';
import { moduleLoader } from '../files/loaders.js';
import { LunariaConfigSchema } from './schema.js';
import type { LunariaConfig, LunariaUserConfig } from './types.js';

// Paths to search for the Lunaria config file,
// sorted by chance of appearing.
const configPaths = Object.freeze([
	'lunaria.config.mjs',
	'lunaria.config.js',
	'lunaria.config.ts',
	'lunaria.config.mts',
	'lunaria.config.cjs',
	'lunaria.config.cts',
]);

function findConfig() {
	for (const path of configPaths) {
		if (existsSync(resolve(path))) {
			return path;
		}
	}

	return new Error(ConfigNotFound.message);
}

export function loadConfig() {
	const path = findConfig();
	if (path instanceof Error) {
		throw path;
	}

	const mod = moduleLoader(path);
	if (mod instanceof Error) {
		throw mod;
	}

	return validateConfig(mod);
}

export function validateConfig(config: LunariaUserConfig) {
	return parseWithFriendlyErrors(LunariaConfigSchema, config) as LunariaConfig;
}
