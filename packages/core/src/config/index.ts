import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { z } from 'zod';
import { error } from '../cli/console.js';
import { loadWithJiti } from '../utils.js';
import { errorMap } from './error-map.js';
import {
	LunariaConfigSchema,
	LunariaRendererConfigSchema,
	type LunariaUserConfig,
	type LunariaUserRendererConfig,
} from './schemas.js';

export * from './schemas.js';

export async function loadConfig(path: string) {
	if (/\.json$/.test(path)) {
		try {
			const userConfig = validateConfig(readConfig(path));
			const rendererConfig = await loadRendererConfig(userConfig.renderer);

			return { userConfig, rendererConfig };
		} catch (e) {
			console.error(error('Failed to load Lunaria config\n'));
			throw e;
		}
	}

	console.error(error('Invalid Lunaria config extension, expected .json'));
	process.exit(1);
}

export async function loadRendererConfig(path: string | undefined) {
	/** Early return if the base config doesn't contain a renderer path. */
	if (!path) return undefined;

	if (/\.(c|m)?(js|ts)$/.test(path)) {
		try {
			const rawConfig = await loadWithJiti(path);
			const rendererConfig = validateRendererConfig(rawConfig);

			return rendererConfig;
		} catch (e) {
			console.error(error('Failed to load Lunaria renderer config\n'));
			throw e;
		}
	}

	console.error(error('Invalid Lunaria renderer config extension, expected .(c/m)js or .(c/m)ts'));
	process.exit(1);
}

export function validateConfig(config: LunariaUserConfig) {
	const parsedConfig = parseWithFriendlyErrors(
		LunariaConfigSchema,
		config,
		'Invalid Lunaria config:\n'
	);
	return parsedConfig;
}

export function validateRendererConfig(config: LunariaUserRendererConfig) {
	const parsedConfig = parseWithFriendlyErrors(
		LunariaRendererConfigSchema,
		config,
		'Invalid Lunaria renderer config:\n'
	);
	return parsedConfig;
}

export function readConfig(path: string) {
	const resolvedPath = resolve(path);

	if (/\.json$/.test(resolvedPath)) {
		try {
			const configString = readFileSync(resolvedPath, 'utf-8');
			return JSON.parse(configString);
		} catch (e) {
			console.error(error('Failed to write Lunaria config\n'));
			throw e;
		}
	}

	console.error(error('Invalid Lunaria config extension, expected .json'));
	process.exit(1);
}

export function writeConfig(path: string, config: LunariaUserConfig) {
	const resolvedPath = resolve(path);

	if (/\.json$/.test(resolvedPath)) {
		try {
			const configString = JSON.stringify(config, null, 2);
			writeFileSync(resolvedPath, configString);
			return;
		} catch (e) {
			console.error(error('Failed to write Lunaria config\n'));
			throw e;
		}
	}

	console.error(error('Invalid Lunaria config extension, expected .json'));
	process.exit(1);
}

export function parseWithFriendlyErrors<T extends z.Schema>(
	schema: T,
	input: z.input<T>,
	message: string
): z.output<T> {
	const parsedConfig = schema.safeParse(input, { errorMap });

	if (!parsedConfig.success) {
		console.error(
			error(message + parsedConfig.error.issues.map((i) => `- ${i.message}`).join('\n'))
		);
		process.exit(1);
	}

	return parsedConfig.data;
}
