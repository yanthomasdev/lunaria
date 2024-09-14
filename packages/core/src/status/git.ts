import { cpus } from 'node:os';
import { resolve } from 'node:path';
import type { ConsolaInstance } from 'consola';
import picomatch from 'picomatch';
import { type DefaultLogFields, type ListLogLine, simpleGit } from 'simple-git';
import type { LunariaConfig } from '../config/types.js';
import { UncommittedFileFound } from '../errors/errors.js';
import type { RegExpGroups } from '../utils/types.js';
import { useCache } from './cache.js';

export class LunariaGitInstance {
	#git = simpleGit({
		maxConcurrentProcesses: Math.max(2, Math.min(32, cpus().length)),
	});
	#config: LunariaConfig;
	#logger: ConsolaInstance;
	cache: Record<string, string>;

	constructor(config: LunariaConfig, logger: ConsolaInstance) {
		this.#logger = logger;
		this.#config = config;
		this.cache = useCache(this.#config.cacheDir, 'git').contents ?? {};
	}

	async getFileLatestChanges(path: string) {
		// The cache will keep the latest tracked change hash, that means it will be able
		// to completely skip older commits.
		const log = await this.#git.log({
			file: resolve(path),
			strictDate: true,
			from: this.cache[path] ? `${this.cache[path]}^` : undefined,
		});

		const latestChange = log.latest;
		/**
		 * Edge case: it might be possible all the changes for a file have
		 * been purposefully ignored in Lunaria, therefore we need to define
		 * the latest change as the latest tracked change.
		 * TODO: Check if this is not an stupid assumption.
		 */
		const latestTrackedChange =
			findLatestTrackedCommit(this.#config.tracking, path, log.all) ?? latestChange;

		if (!latestChange || !latestTrackedChange) {
			this.#logger.error(UncommittedFileFound.message(path));
			process.exit(1);
		}

		this.cache[path] = latestTrackedChange.hash;

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

		// TODO: Test this function with multiple paths and globs.
		return (
			pathsOrGlobs.split(';').find((pathOrGlob) => {
				if (directive === '@lunaria-track') return picomatch.isMatch(path, pathOrGlob);
				if (directive === '@lunaria-ignore') return !picomatch.isMatch(path, pathOrGlob);
			}) !== undefined
		);
	});
}
