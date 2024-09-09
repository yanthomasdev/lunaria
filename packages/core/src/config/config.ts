import * as find from 'empathic/find';
import { ConfigNotFound } from '../errors/errors.js';
import { parseWithFriendlyErrors } from '../errors/index.js';
import { moduleLoader } from '../files/loaders.js';
import { LunariaConfigSchema } from './schema.js';
import type { LunariaConfig, LunariaUserConfig } from './types.js';

// Paths to search for the Lunaria config file,
// sorted by chance of appearing.
const configPaths = [
	'lunaria.config.mjs',
	'lunaria.config.js',
	'lunaria.config.ts',
	'lunaria.config.mts',
	'lunaria.config.cjs',
	'lunaria.config.cts',
] as const;

function findConfig() {
	for (const path of configPaths) {
		const filePath = find.up(path);
		if (filePath) return filePath;
	}

	return new Error(ConfigNotFound.message);
}

export async function loadConfig() {
	const path = findConfig();
	if (path instanceof Error) {
		throw path;
	}

	const mod = await moduleLoader(path);
	if (mod instanceof Error) {
		throw mod;
	}

	return validateConfig(mod);
}

export function validateConfig(config: LunariaUserConfig) {
	return parseWithFriendlyErrors(LunariaConfigSchema, config) as LunariaConfig;
}
