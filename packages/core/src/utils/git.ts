import { existsSync, rmSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { simpleGit } from 'simple-git';
import type { LunariaConfig } from '../types.js';

const git = simpleGit({
	maxConcurrentProcesses: Math.max(2, Math.min(32, os.cpus().length)),
});

/** Creates a clone of the git history to be used on platforms
 * that only allow shallow repositores (e.g. Vercel) and returns
 * `true` if it's running on a shallow repository.
 */
export async function handleShallowRepo({ cloneDir, repository }: LunariaConfig) {
	const isShallowRepo = await git.revparse(['--is-shallow-repository']);
	if (isShallowRepo === 'true') {
		console.info(
			'A shallow repository was detected: a clone of your repository will be downloaded and used instead.'
		);

		const target = resolve(cloneDir);

		if (existsSync(target)) rmSync(target, { recursive: true, force: true });

		const remote = `${repository}.git`;

		await git.clone(remote, target, ['--bare', '--filter=blob:none']);
		// Use the clone as the git directory for all tasks
		await git.cwd({ path: target, root: true });
	}
	return isShallowRepo === 'true';
}

export async function getPageHistory(filePath: string) {
	const log = await git.log({
		file: filePath,
		strictDate: true,
	});

	return {
		latest: log.latest,
		all: log.all,
	};
}
