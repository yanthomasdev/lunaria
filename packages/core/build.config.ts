import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: ['src/index', 'src/dashboard/components', 'src/cli'],
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
