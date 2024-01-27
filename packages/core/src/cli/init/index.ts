import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	bold,
	confirm,
	error,
	failure,
	highlight,
	init as i,
	isCancel,
	select,
	text,
} from '../console.js';
import type { InitOptions } from '../types.js';

export async function init(options: InitOptions) {
	const configPath = resolve(options.config ?? './lunaria.config.json');
	const packageJsonPath = resolve('./package.json');

	const config: Record<any, any> = {
		$schema: './node_modules/@lunariajs/core/config.schema.json',
		repository: {},
	};

	const gitHosting = await select({
		message: i('What is the git hosting of your repository?'),
		options: [
			{
				value: 'github',
				label: 'GitHub',
			},
			{
				value: 'gitlab',
				label: 'GitLab',
			},
		],
	});

	if (isCancel(gitHosting)) {
		console.log(failure('Operation cancelled.'));
		process.exit(0);
	}

	// "github" is the default value, can be omitted.
	if (gitHosting !== 'github') config.repository.hosting = gitHosting;

	const repoName = await text({
		message: i('What is the unique name of your repository?'),
		placeholder: 'Yan-Thomas/lunaria',
	});

	if (isCancel(repoName)) {
		console.log(failure('Operation cancelled.'));
		process.exit(0);
	}

	config.repository.name = repoName;

	const repoBranch = await text({
		message: i('What is the main branch of your repository?'),
		placeholder: 'main',
	});

	if (isCancel(repoBranch)) {
		console.log(failure('Operation cancelled.'));
		process.exit(0);
	}

	// "main" is the default value, can be omitted.
	if (repoBranch !== 'main') config.repository.branch = repoBranch;

	const isMonorepo = await confirm({
		message: i("Are you setting Lunaria on a monorepo's project?"),
		initialValue: false,
	});

	if (isCancel(isMonorepo)) {
		console.log(failure('Operation cancelled.'));
		process.exit(0);
	}

	if (isMonorepo) {
		const repoRootDir = await text({
			message: i('What is the root directory of your project?'),
			placeholder: 'docs',
		});

		if (isCancel(repoRootDir)) {
			console.log(failure('Operation cancelled.'));
			process.exit(0);
		}

		config.repository.rootDir = repoRootDir;
	}

	try {
		const configJson = JSON.stringify(config, null, 2);
		writeFileSync(configPath, configJson);
	} catch {
		console.error(error('Failed to create your Lunaria config.'));
	}

	const trySync = await confirm({
		message: i('Try syncing the rest of your config based on your project?'),
		initialValue: false,
	});

	if (isCancel(trySync)) {
		console.log(failure('Operation cancelled.'));
		process.exit(0);
	}

	if (trySync) {
		const { sync } = await import('../sync/index.js');
		await sync({
			config: options.config,
			'skip-questions': false,
			package: undefined,
		});
	}

	if (existsSync(packageJsonPath)) {
		try {
			const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
			packageJson.scripts = {
				...packageJson.scripts,
				'lunaria:build': 'lunaria build',
			};

			writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
			console.log(i('Added lunaria scripts to your package.json file.'));
		} catch {
			console.error(error("Failed to update your package.json's scripts."));
		}
	}

	console.log(i(`Config created at: ${highlight(configPath)}`));
	console.log(
		i(
			`You're almost done, read your next steps: ${highlight(
				'https://lunaria.dev/getting-started/#next-steps'
			)}`
		)
	);
	console.log(i(bold('Complete!')));
}
