import { cpus } from 'node:os';
import { join, resolve } from 'node:path';
import type { ConsolaInstance } from 'consola';
import picomatch from 'picomatch';
import { type DefaultLogFields, type ListLogLine, simpleGit } from 'simple-git';
import type { LunariaConfig } from '../config/types.js';
import { UncommittedFileFound } from '../errors/errors.js';
import type { RegExpGroups } from '../utils/types.js';
import { exists } from '../utils/utils.js';

export class LunariaGitInstance {
	#git = simpleGit({
		maxConcurrentProcesses: Math.max(2, Math.min(32, cpus().length)),
	});
	#config: LunariaConfig;
	#logger: ConsolaInstance;
	#force: boolean;
	#cache: Record<string, string>;

	constructor(
		config: LunariaConfig,
		logger: ConsolaInstance,
		cache: Record<string, string>,
		force = false,
	) {
		this.#logger = logger;
		this.#config = config;
		this.#force = force;
		this.#cache = cache;
	}

	async getFileLatestChanges(path: string) {
		// The cache will keep the latest tracked change hash, that means it will be able
		// to completely skip looking into older commits, considerably increasing performance.
		const log = await this.#git.log({
			file: path,
			strictDate: true,
			from: this.#cache[path] ? `${this.#cache[path]}^` : undefined,
		});

		const latestChange = log.latest;
		// Edge case: sometimes all the changes for a file (or the only one)
		// have been purposefully ignored in Lunaria, therefore we need to
		// define the latest change as the latest tracked change.
		const latestTrackedChange =
			findLatestTrackedCommit(this.#config.tracking, path, log.all) ?? latestChange;

		if (!latestChange || !latestTrackedChange) {
			this.#logger.error(UncommittedFileFound.message(path));
			process.exit(1);
		}

		if (!this.#force) this.#cache[path] = latestTrackedChange.hash;

		return {
			latestChange: {
				date: latestChange.date,
				message: latestChange.message,
				hash: latestChange.hash,
			},
			latestTrackedChange: {
				date: latestTrackedChange.date,
				message: latestTrackedChange.message,
				hash: latestTrackedChange.hash,
			},
		};
	}

	// TODO: Using an external repo seems to introduce some sort of performance gains, this should be tested to ensure
	// its not a bug e.g. not being able to read certain files or the git history not being complete and missing commits
	// that are necessary for the status to be accurate.
	async handleExternalRepository() {
		const { cloneDir, repository } = this.#config;
		const { name, hosting, rootDir } = repository;

		// The name can contain a slash, which is not allowed in a directory name.
		const safeName = name.replace('/', '-');
		const clonePath = resolve(cloneDir, safeName);

		// We need to prepend the root directory so it works in monorepos.
		// TODO: Test if this causes any issues in non-monorepo contexts.
		const monorepoSafePath = join(clonePath, rootDir);

		// The external repository has to be a full clone since we need the source contents for features like using `localizableProperty`.
		if (!(await exists(clonePath))) {
			// TODO: Implement a way to support private repositories.
			this.#logger.start("External repository is enabled. Cloning repository's contents...");
			await this.#git.clone(`https://${hosting}.com/${name}.git`, clonePath);
			// We need to change the working directory to the cloned repository, so all git commands are executed in the correct context.
			await this.#git.cwd(monorepoSafePath);
		} else {
			await this.#git.cwd(monorepoSafePath);
			await this.#git.pull();
		}
		return monorepoSafePath;
	}

	get cache() {
		return this.#cache;
	}
}

/**
 * Finds the latest tracked commit in a list of commits, tracked means
 * the latest commit that wasn't ignored from Lunaria's tracking system,
 * either by the use of a tracker directive or the inclusion of a ignored
 * keyword in the commit's name.
 */
export function findLatestTrackedCommit(
	tracking: LunariaConfig['tracking'],
	path: string,
	commits: Readonly<Array<DefaultLogFields & ListLogLine>> | Array<DefaultLogFields & ListLogLine>,
) {
	/** Regex that matches a `'@lunaria-track'` or `'@lunaria-ignore'` group
	 * and a sequence of paths separated by semicolons till a line break.
	 *
	 * This means whenever a valid tracker directive is found, the tracking system
	 * lets the user take over and cherry-pick which files' changes should be tracked
	 * or ignored.
	 */
	const trackerDirectivesRe =
		/(?<directive>@lunaria-track|@lunaria-ignore):(?<pathsOrGlobs>[^\n]+)?/;

	/** Regex that matches any configured ignored keywords in the user's Lunaria config. */
	const ignoredKeywordsRe = new RegExp(`(${tracking.ignoredKeywords.join('|')})`, 'i');

	return commits.find((commit) => {
		// Ignored keywords take precedence over tracker directives.
		if (commit.message.match(ignoredKeywordsRe)) return false;

		const trackerDirectiveMatch: RegExpGroups<'directive' | 'pathsOrGlobs'> =
			commit.body.match(trackerDirectivesRe);

		// If no tracker directive is found, we consider the commit as tracked.
		if (!trackerDirectiveMatch || !trackerDirectiveMatch.groups) return true;

		const { directive, pathsOrGlobs } = trackerDirectiveMatch.groups;

		const foundPath = pathsOrGlobs
			.split(';')
			// We filter here to avoid empty strings if an extra semicolon is added at the end.
			.filter((val) => val.length > 0)
			.find((pathOrGlob) => {
				if (directive === '@lunaria-track') return picomatch.isMatch(path, pathOrGlob);
				if (directive === '@lunaria-ignore') return picomatch.isMatch(path, pathOrGlob);
			});

		// If we find the path and it's a `track` directive, we consider the commit as the latest tracked.
		// Otherwise, we consider the commit as ignored.
		if (foundPath) return directive === '@lunaria-track';

		// If we don't find the path (undefined), for a `track` directive, we consider the commit as ignored, and for `ignore` as tracked.
		return directive === '@lunaria-ignore';
	});
}
