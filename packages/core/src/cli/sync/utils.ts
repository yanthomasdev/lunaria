import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { File, Locale } from '../../types.js';
import { error, sync } from '../messages.js';
import { confirm, handleCancel } from '../prompts.js';

export async function updateConfig(
	configPath: string,
	defaultLocale: Locale | undefined,
	locales: Locale[] | undefined,
	file: Omit<File, 'ignore'>,
	skip: boolean
) {
	const config = readConfig(configPath);

	if (defaultLocale) {
		let answer: boolean = true;
		if (!skip) {
			const updateDefaultLocale = await confirm({
				message: sync('Update defaultLocale?'),
				initialValue: true,
			});

			handleCancel(updateDefaultLocale);

			answer = Boolean(updateDefaultLocale);
		}

		if (answer || skip) config.defaultLocale = defaultLocale;
	}

	if (locales) {
		let answer: boolean = true;
		if (!skip) {
			const updateLocales = await confirm({
				message: sync('Update locales?'),
				initialValue: true,
			});

			handleCancel(updateLocales);

			answer = Boolean(updateLocales);
		}

		if (answer || skip) config.locales = locales;
	}

	if (file) {
		let answer: boolean = true;
		if (!skip) {
			const updateFiles = await confirm({
				message: sync('Update files?'),
				initialValue: true,
			});

			handleCancel(updateFiles);

			answer = Boolean(updateFiles);
		}

		const otherFiles = config.files?.filter((f) => f.location !== file.location) ?? [];

		if (answer || skip) config.files = [file, ...otherFiles];
	}

	writeConfig(configPath, config);
}

function readConfig(configPath: string): {
	defaultLocale?: Locale;
	locales?: Locale[];
	files?: Omit<File, 'ignore'>[];
} {
	const resolvedPath = resolve(configPath);

	try {
		const config = JSON.parse(readFileSync(resolvedPath, 'utf-8'));
		return config;
	} catch (e) {
		console.error(error('Failed to read Lunaria config\n'));
		throw e;
	}
}

function writeConfig(configPath: string, config: any) {
	const resolvedPath = resolve(configPath);

	try {
		const configJSON = JSON.stringify(config, null, 2);
		writeFileSync(resolvedPath, configJSON);
	} catch (e) {
		console.error(error('Failed to write Lunaria config\n'));
		throw e;
	}
}
