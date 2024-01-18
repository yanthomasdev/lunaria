import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig([
	{
		preset: '../../build.preset.ts',
		entries: [
			'src/index',
			'src/dashboard/index',
			'src/dashboard/components',
			'src/status/index',
			'src/status/git',
			'src/config/index',
			'src/cli/index',
			'src/cli/console',
		],
	},
]);
