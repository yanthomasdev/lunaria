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
	const { help } = await import('./commands/help.js');
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
				const { build } = await import('./commands/build.js');
				await build(options);
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

await main();
