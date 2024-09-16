import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { jsonLoader } from '../files/loaders.js';

export function useCache(cacheDir: string, entry: string) {
	const resolvedCacheDir = resolve(cacheDir);
	const file = `${entry}.json`;

	if (!existsSync(resolvedCacheDir)) {
		mkdirSync(resolvedCacheDir, { recursive: true });
	}

	const cachePath = join(resolvedCacheDir, file);

	return {
		contents: existsSync(cachePath) ? jsonLoader(cachePath) : undefined,
		write(contents: unknown) {
			// TODO: Test with writeFile instead.
			return writeFileSync(cachePath, JSON.stringify(contents));
		},
	};
}
