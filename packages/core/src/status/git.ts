import { existsSync, rmSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { simpleGit } from 'simple-git';
import { info } from '../cli/messages.js';
import type { LunariaConfig } from '../types.js';
import { cleanJoinURL, getStringFromFormat } from '../utils.js';

const git = simpleGit({
	maxConcurrentProcesses: Math.max(2, Math.min(32, os.cpus().length)),
});

/** Creates a clone of the git history to be used on platforms
 * that only allow shallow repositores (e.g. Vercel) and returns
 * `true` if it's running on a shallow repository.
 */
export async function handleShallowRepo({ cloneDir, repository }: LunariaConfig) {
	const gitHostingLinks = getGitHostingLinks(repository);
	const isShallowRepo = (await git.revparse(['--is-shallow-repository'])) === 'true';

	if (isShallowRepo) {
		console.log(
			info(
				"Shallow repository detected. A clone of your repository's history will be downloaded and used. "
			)
		);

		const target = resolve(cloneDir);

		if (existsSync(target)) rmSync(target, { recursive: true, force: true });

		await git.clone(gitHostingLinks.clone(), target, ['--bare', '--filter=blob:none']);
		// Use the clone as the git directory for all tasks
		await git.cwd({ path: target, root: true });
	}

	return isShallowRepo;
}

export async function getFileHistory(path: string) {
	const log = await git.log({
		file: path,
		strictDate: true,
	});

	return {
		latest: log.latest,
		all: log.all,
	};
}

export function getGitHostingLinks(repository: LunariaConfig['repository']) {
	const { name, branch, hosting, rootDir } = repository;

	if (hosting === 'github')
		return {
			create: (filePath: string) =>
				`https://github.com/${name}/new/${branch}?filename=${cleanJoinURL(rootDir, filePath)}`,
			source: (filePath: string) =>
				`https://github.com/${name}/blob/${branch}/${cleanJoinURL(rootDir, filePath)}`,
			history: (filePath: string, sinceDate: string) =>
				`https://github.com/${name}/commits/${branch}/${cleanJoinURL(
					rootDir,
					filePath
				)}?since=${sinceDate}`,
			clone: () => `https://github.com/${name}.git`,
		};

	if (hosting === 'gitlab')
		return {
			create: (filePath: string) =>
				`https://gitlab.com/${name}/-/new/${branch}?file_name=${cleanJoinURL(rootDir, filePath)}`,
			source: (filePath: string) =>
				`https://gitlab.com/${name}/-/blob/${branch}/${cleanJoinURL(rootDir, filePath)}`,
			history: (filePath: string, sinceDate: string) =>
				`https://gitlab.com/${name}/-/commits/${branch}/${cleanJoinURL(
					rootDir,
					filePath
				)}?since=${sinceDate}`,
			clone: () => `https://gitlab.com/${name}.git`,
		};

	return {
		create: (filePath: string) =>
			hosting.create
				? getStringFromFormat(hosting.create, {
						':name': name,
						':branch': branch,
						':path': cleanJoinURL(rootDir, filePath),
				  })
				: null,
		source: (filePath: string) =>
			hosting.source
				? getStringFromFormat(hosting.source, {
						':name': name,
						':branch': branch,
						':path': cleanJoinURL(rootDir, filePath),
				  })
				: null,
		history: (filePath: string, sinceDate: string) =>
			hosting.history
				? getStringFromFormat(hosting.history, {
						':name': name,
						':branch': branch,
						':path': cleanJoinURL(rootDir, filePath),
						':since': sinceDate,
				  })
				: null,
		clone: () =>
			getStringFromFormat(hosting.clone, {
				':name': name,
			}),
	};
}
