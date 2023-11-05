import { definePreset } from 'unbuild';

export default definePreset({
	clean: true,
	declaration: true,
	sourcemap: true,
	rollup: {
		esbuild: {
			target: 'es2022',
			minify: true,
		},
	},
});
