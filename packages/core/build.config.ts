import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	clean: true,
	declaration: true,
	sourcemap: true,
	rollup: {
		emitCJS: true,
		inlineDependencies: true,
		esbuild: {
			minify: true,
		},
	},
});
