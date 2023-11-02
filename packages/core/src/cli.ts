#!/usr/bin/env node

import { loadConfig } from 'c12';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { LunariaConfigSchema } from './schemas/config.js';
import { generateDashboardHtml, getContentIndex, getTranslationStatus } from './tracker.js';
import { handleShallowRepo } from './utils/git.js';

async function run() {
	const { config } = await loadConfig({
		name: 'lunaria',
	});

	if (!config || !Object.keys(config).length) {
		console.error(new Error('Could not find a `lunaria.config.*` file, does it exist?'));
		process.exit(1);
	}

	const parsedConfig = LunariaConfigSchema.safeParse(config);

	if (!parsedConfig.success) {
		console.error(
			new Error(
				'Invalid configuration options passed to `@lunariajs/core`\n' +
					parsedConfig.error.issues.map((i) => i).join('\n')
			)
		);
		process.exit(1);
	}

	const userConfig = parsedConfig.data;
	const isShallowRepo = await handleShallowRepo(userConfig);

	console.time('⌛ Building translation dashboard');
	console.log(`➡️  Dashboard output path: ${resolve(userConfig.outDir)}`);

	const contentIndex = await getContentIndex(userConfig, isShallowRepo);
	const translationStatus = await getTranslationStatus(userConfig, contentIndex);
	const html = await generateDashboardHtml(userConfig, translationStatus);

	const outputDir = dirname(userConfig.outDir);

	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
	}

	writeFileSync(userConfig.outDir, html);

	console.timeEnd('⌛ Building translation dashboard');
	console.log('✅ Translation dashboard built successfully!');
}

run();
