import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadConfig } from '../../config/index.js';
import { generateDashboard } from '../../dashboard/index.js';
import { handleShallowRepo } from '../../status/git.js';
import { getLocalizationStatus } from '../../status/index.js';
import type { LocalizationStatus, LunariaConfig } from '../../types.js';
import { build as b, bold, error, highlight, success } from '../messages.js';
import type { BuildOptions } from '../types.js';

export async function build(options: BuildOptions) {
	const buildStartTime = performance.now();

	/** Command options */
	const configPath = options.config ?? './lunaria.config.json';
	const skipStatus = options['skip-status'] ?? false;

	const { userConfig, rendererConfig } = await loadConfig(configPath);

	/** Output paths */
	const outDir = resolve(userConfig.outDir);
	const statusPath = join(outDir, 'status.json');
	const dashboardPath = join(outDir, 'index.html');

	/** Create the output directory if it doesn't exist yet. */
	if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

	console.log(b(`Output directory: ${highlight(outDir)}`));

	/** Git */
	const gitStartTime = performance.now();
	console.log(b('Preparing git repository...'));

	const isShallowRepo = await handleShallowRepo(userConfig);

	const gitEndTime = performance.now();
	console.log(b(success(`Completed in ${getFormattedTime(gitStartTime, gitEndTime)}`)));

	/** Status */
	const statusStartTime = performance.now();
	console.log(
		b(skipStatus ? 'Status build skipped, loading previous status...' : 'Building status...')
	);

	const status = await getStatus(userConfig, isShallowRepo, skipStatus, statusPath);

	/** Save status to disk if the status build wasn't skipped. */
	if (!skipStatus) writeFileSync(statusPath, JSON.stringify(status, null, 2));

	const statusEndTime = performance.now();
	console.log(b(success(`Completed in ${getFormattedTime(statusStartTime, statusEndTime)}`)));

	/** Dashboard */
	const dashboardStartTime = performance.now();
	console.log(b('Building dashboard...'));

	const dashboard = await generateDashboard(userConfig, rendererConfig, status);
	writeFileSync(dashboardPath, dashboard);

	const dashboardEndTime = performance.now();
	console.log(b(success(`Completed in ${getFormattedTime(dashboardStartTime, dashboardEndTime)}`)));

	/** End build */
	const buildEndTime = performance.now();

	console.log(b(`${bold('Complete!')} Built in ${getFormattedTime(buildStartTime, buildEndTime)}`));
}

async function getStatus(
	config: LunariaConfig,
	isShallowRepo: boolean,
	skip: boolean,
	statusPath: string
) {
	/** If the user decided to skip the status generation, we use the most recent one from disk. */
	if (skip) {
		try {
			const file = readFileSync(statusPath, 'utf-8');
			const status = JSON.parse(file);

			return status as LocalizationStatus[];
		} catch (e) {
			console.error(error(`Failed to load local status at ${highlight(statusPath)}\n`));
			throw e;
		}
	}
	return await getLocalizationStatus(config, isShallowRepo);
}

function getFormattedTime(start: number, end: number) {
	const seconds = (end - start) / 1000;
	return `${seconds.toFixed(2)}s`;
}
