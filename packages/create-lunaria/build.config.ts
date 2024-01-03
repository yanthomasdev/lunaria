import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: ['src/create-lunaria'],
	rollup: {
		esbuild: {
			target: 'es2022',
			minify: true,
		},
	},
});
