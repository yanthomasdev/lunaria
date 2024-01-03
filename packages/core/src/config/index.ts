import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fromZodError } from 'zod-validation-error';
import { error } from '../cli/messages.js';
import { loadWithJiti } from '../utils.js';
import {
	LunariaConfigSchema,
	LunariaRendererConfigSchema,
	type LunariaUserConfig,
	type LunariaUserRendererConfig,
} from './schemas.js';

const fromZodErrorOptions = {
	prefix: '- ',
	prefixSeparator: '',
	issueSeparator: '\n- ',
};

export async function loadConfig(path: string) {
	const resolvedPath = resolve(path);

	if (/\.json$/.test(resolvedPath)) {
		try {
			const rawConfig = JSON.parse(readFileSync(resolvedPath, 'utf-8'));
			const userConfig = validateConfig(rawConfig);
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
	const parsedConfig = LunariaConfigSchema.safeParse(config);

	if (parsedConfig.success) {
		return parsedConfig.data;
	}

	const validationError = fromZodError(parsedConfig.error, fromZodErrorOptions);

	console.error(error('Invalid Lunaria config:\n' + validationError));
	process.exit(1);
}

export function validateRendererConfig(config: LunariaUserRendererConfig) {
	const parsedConfig = LunariaRendererConfigSchema.safeParse(config);

	if (parsedConfig.success) {
		return parsedConfig.data;
	}

	const validationError = fromZodError(parsedConfig.error, fromZodErrorOptions);

	console.error(error('Invalid Lunaria renderer config:\n' + validationError));
	process.exit(1);
}
