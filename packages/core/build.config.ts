import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	preset: '../../build.preset.ts',
	entries: ['src/index', 'src/dashboard/components', 'src/cli'],
});
