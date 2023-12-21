#!/usr/bin/env node

import * as p from '@clack/prompts';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { addDependency, detectPackageManager, installDependencies } from 'nypm';
import color from 'picocolors';

const cleanConfigContent = JSON.stringify(
	{
		$schema: './node_modules/@lunariajs/core/config.schema.json',
	},
	null,
	2
);

async function main() {
	console.clear();

	p.intro(`${color.bgGreen('create-lunaria')}`);

	const project = await p.group(
		{
			path: () =>
				p.text({
					message: 'Where should we set up Lunaria?',
					placeholder: './rosetta-stone',
					validate: (value) => {
						if (value[0] !== '.') return 'Please enter a relative path.';
					},
				}),
			install: () =>
				p.confirm({
					message: 'Install dependencies?',
					initialValue: false,
				}),
		},
		{
			onCancel: () => {
				p.cancel('Setup wizard cancelled.');
				process.exit(0);
			},
		}
	);

	const projectPath = resolve(project.path);
	const packageJsonPath = join(projectPath, 'package.json');

	const packageManager = await detectPackageManager(projectPath, {
		includeParentDirs: true,
	});

	if (!packageManager) {
		p.cancel('Could not find your package manager. Setup wizard cancelled.');
		process.exit(1);
	}

	const spinner = p.spinner();

	spinner.start(`Adding packages`);

	await addDependency('@lunariajs/core', {
		cwd: projectPath,
		packageManager: packageManager,
		silent: true,
	});

	spinner.stop(`Added packages.`);

	if (existsSync(packageJsonPath)) {
		spinner.start(`Adding ${color.bold('lunaria')} script`);
		const file = readFileSync(packageJsonPath, 'utf-8');
		const json = JSON.parse(file);

		json.scripts = {
			...json.scripts,
			lunaria: 'lunaria',
		};

		writeFileSync(packageJsonPath, JSON.stringify(json, null, 2));

		spinner.stop(`Added ${color.bold('lunaria')} script.`);
	} else {
		p.log.warn(
			`Could not add the ${color.bold(
				'lunaria'
			)} script to your project. Refer to the Lunaria configuration to add it manually.`
		);
	}

	if (project.install) {
		spinner.start(`Installing via ${packageManager.name}`);

		await installDependencies({
			cwd: projectPath,
			packageManager: packageManager,
			silent: true,
		});

		spinner.stop(`Installed via ${packageManager.name}.`);
	} else {
		p.log.warn(
			`Installation skipped. Don't forget to use ${color.bold(
				`${packageManager.name} install`
			)} before using Lunaria!`
		);
	}

	const configFilename = `lunaria.config.json`;
	const configFilePath = join(projectPath, configFilename);

	if (!existsSync(configFilePath)) {
		writeFileSync(configFilePath, cleanConfigContent);
		p.log.message(`${color.bold(configFilename)} created at ${color.italic(configFilePath)}`);
	} else {
		p.log.warn(
			`Configuration skipped. ${color.bold(configFilename)} file already exists in your project.`
		);
	}

	p.note(
		`${project.path == '.' ? '' : `cd ${project.path}        \n`}${
			project.install ? '' : `${packageManager.name} install\n`
		}${packageManager.name} run lunaria`,
		'Next steps: '
	);

	p.log.warn(`Do not forget to fill ${color.bold(configFilename)} before running Lunaria!`);

	p.outro(
		`Found any issues? ${color.underline(
			color.cyan('https://github.com/Yan-Thomas/lunaria/issues/new')
		)}`
	);
}

main().catch(console.error);
