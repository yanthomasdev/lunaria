import { definePreset } from 'unbuild';

export default definePreset({
	clean: true,
	declaration: 'node16',
	rollup: {
		esbuild: {
			target: 'es2022',
		},
	},
});
