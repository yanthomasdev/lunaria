#!/usr/bin/env node
import { parseCommand } from './helpers.js';
import type { CLI } from './types.js';

const cli: CLI = {
	commands: [
		{
			name: 'build',
			description: 'Build your dashboard and status to disk.',
			usage: '[...options]',
			options: [
				{
					name: '--skip-status',
					description: 'Skip the status build and use the one from disk instead.',
				},
			],
		},
		{
			name: 'sync',
			description:
				"Sync your config's files and/or locales fields based on your project's structure.",
			usage: '[...options]',
			options: [
				{
					name: '--package <package>',
					description: 'Skip the package selection and use the specified one instead.',
				},
				{
					name: '--skip-questions',
					description: 'Confirm all config changes without waiting for prompts.',
				},
			],
		},
	],
	options: [
		{
			name: '--help',
			description: 'Show this help message.',
		},
		{
			name: '--config <path>',
			description: 'Specify the location of your config file.',
		},
	],
};

async function showHelp(command?: string) {
	const { help } = await import('./help/index.js');
	help(cli, command);
}

/** CLI entrypoint */
async function main() {
	try {
		const { name, options } = parseCommand();

		if (name && options.help) {
			await showHelp(name);
			return;
		}

		switch (name) {
			case 'build':
				const { build } = await import('./build/index.js');
				await build(options);
				break;
			case 'sync':
				const { sync } = await import('./sync/index.js');
				await sync(options);
				break;
			default:
				await showHelp();
				break;
		}
	} catch (e) {
		/** Filter out parseArgs errors (invalid/unknown option) and instead show help */
		if (e instanceof TypeError && e?.stack?.includes('ERR_PARSE_ARGS')) await showHelp();
		else throw e;
	}
}

main().catch(console.error);
