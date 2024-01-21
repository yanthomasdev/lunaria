import type { LunariaConfig } from '@lunariajs/core/config';
import { git } from '@lunariajs/core/git';
import { getLocalizationStatus } from '@lunariajs/core/status';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

let lastExecutionDate: string | undefined;
const cacheDir = resolve('./node_modules/.cache/lunaria/');
const cachedStatusPath = join(cacheDir, 'status.json');

export async function getStatusFromCache(userConfig: LunariaConfig, isShallowRepo: boolean) {
	const latestCommitDate = (await git.log({ maxCount: 1 })).latest?.date;

	if (latestCommitDate === lastExecutionDate) {
		return JSON.parse(readFileSync(cachedStatusPath, 'utf-8'));
	}

	const status = await getLocalizationStatus(userConfig, isShallowRepo);

	// Create cache directory if it doesn't exist already.
	if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

	writeFileSync(cachedStatusPath, JSON.stringify(status));
	lastExecutionDate = latestCommitDate;

	return status;
}
