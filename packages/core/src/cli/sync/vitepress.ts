import glob from 'fast-glob';
import type { File, Locale } from '../../types.js';
import { loadWithJiti } from '../../utils.js';
import { error } from '../messages.js';
import { updateConfig } from './utils.js';

export async function vitepress(configPath: string, skipQuestions: boolean) {
	const config: {
		locales?: Record<string, Locale>;
	} = await loadVitepressConfig();

	const allLocales = config.locales
		? Object.values(config.locales).map(({ lang, label }) => ({ label: label, lang: lang }))
		: undefined;

	const defaultLocale = allLocales?.find((locale) => locale.label === config.locales?.root?.label);
	const locales = allLocales?.filter((locale) => locale.label !== defaultLocale?.label);

	const file: Omit<File, 'ignore'> = {
		location: '**/*.md',
		pattern: '@lang/@path',
		type: 'universal',
	};

	await updateConfig(configPath, defaultLocale, locales, file, skipQuestions);
}

async function loadVitepressConfig() {
	const configPaths = await glob('.vitepress/config.{js,ts,mjs,mts}', {
		cwd: process.cwd(),
		ignore: ['node_modules'],
	});

	if (!configPaths[0]) {
		console.error(error('Failed to find a valid Vitepress config'));
		process.exit(1);
	}

	const vitepressConfig = await loadWithJiti(configPaths[0]);

	return vitepressConfig;
}
