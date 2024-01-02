import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig([
	{
		preset: '../../build.preset.ts',
		entries: ['src/index', 'src/dashboard/components'],
		failOnWarn: false,
	},
	{
		entries: ['src/cli/index'],
		rollup: {
			esbuild: {
				target: 'es2022',
				minify: true,
			},
		},
	},
]);
