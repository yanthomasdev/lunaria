import { parseArgs } from 'node:util';

export function parseCommand() {
	const { positionals, values } = parseArgs({
		allowPositionals: true,
		options: {
			help: {
				type: 'boolean',
			},
			config: {
				type: 'string',
			},
			/** Build command */
			'skip-status': {
				type: 'boolean',
			},
			'stdout-status': {
				type: 'boolean',
			},
			/** Sync command */
			package: {
				type: 'string',
			},
			'skip-questions': {
				type: 'boolean',
			},
			/** Preview command */
			port: {
				type: 'string',
			},
		},
	});

	return {
		name: positionals[0],
		options: values,
	};
}

export function getFormattedTime(start: number, end: number) {
	const seconds = (end - start) / 1000;
	return `${seconds.toFixed(2)}s`;
}
