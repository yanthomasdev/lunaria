#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fromZodError } from 'zod-validation-error';
import { errorOpts } from './constants.js';
import { LunariaConfigSchema, LunariaRendererConfigSchema } from './schemas/config.js';
import { generateDashboardHtml, getContentIndex, getTranslationStatus } from './tracker.js';
import { handleShallowRepo } from './utils/git.js';
import { loadFile } from './utils/misc.js';

const configPath = './lunaria.config.json';

if (!existsSync(configPath)) {
	console.error(
		new Error(`Could not find a \`lunaria.config.json\` file in ${process.cwd()}, does it exist?`)
	);
}

const configContents = JSON.parse(readFileSync(configPath, 'utf-8'));
const parsedConfig = LunariaConfigSchema.safeParse(configContents);

if (!parsedConfig.success) {
	const validationError = fromZodError(parsedConfig.error, errorOpts);

	console.error(
		new Error('Invalid configuration options passed to `@lunariajs/core`:\n' + validationError)
	);
	process.exit(1);
}

const userConfig = parsedConfig.data;

if (userConfig.renderer && !existsSync(userConfig.renderer)) {
	console.error(
		new Error(
			`Could not find your specified renderer file at \`${userConfig.renderer}\`, does it exist?`
		)
	);
	process.exit(1);
}

const rendererConfigContents = userConfig.renderer ? loadFile(userConfig.renderer) : {};
const parsedRendererConfig = LunariaRendererConfigSchema.safeParse(rendererConfigContents);

if (!parsedRendererConfig.success) {
	const validationError = fromZodError(parsedRendererConfig.error, errorOpts);

	console.error(
		new Error(
			'Invalid renderer configuration options passed to `@lunariajs/core`:\n' + validationError
		)
	);
	process.exit(1);
}

const userRendererConfig = parsedRendererConfig.data;
const isShallowRepo = await handleShallowRepo(userConfig);

const outputDir = resolve(userConfig.outDir);
const output = resolve(join(userConfig.outDir, '/index.html'));

console.time('⌛ Building translation dashboard');
console.log(`➡️  Dashboard output path: ${output}`);

const contentIndex = await getContentIndex(userConfig, isShallowRepo);
const translationStatus = await getTranslationStatus(userConfig, contentIndex);
const html = await generateDashboardHtml(userConfig, userRendererConfig, translationStatus);

if (!existsSync(outputDir)) {
	mkdirSync(outputDir, { recursive: true });
}

writeFileSync(output, html);

console.timeEnd('⌛ Building translation dashboard');
console.log('✅ Translation dashboard built successfully!');
