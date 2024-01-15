import { rmSync } from 'node:fs';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig([
	{
		preset: '../../build.preset.ts',
		entries: [
			'src/index',
			'src/dashboard/components',
			{
				input: 'src/cli/index.ts',
				outDir: 'dist/cli/',
				builder: 'rollup',
			},
		],
		hooks: {
			// Cleans empty .d.(m)ts files unnecessary for the CLI
			'build:done': () => {
				rmSync('./dist/cli/index.d.mts');
				rmSync('./dist/cli/index.d.ts');
			},
		},
	},
]);
