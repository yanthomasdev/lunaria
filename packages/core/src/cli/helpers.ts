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
			'skip-status': {
				type: 'boolean',
			},
		},
	});

	return {
		name: positionals[0],
		options: values,
	};
}
