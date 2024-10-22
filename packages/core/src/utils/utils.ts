import { createHash } from 'node:crypto';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { z } from 'zod';
import { errorMap } from '../errors/zod-map.js';
import { jsonLoader } from '../files/loaders.js';

export function isRelative(path: string) {
	return path.startsWith('./') || path.startsWith('../');
}

export function stripTrailingSlash(path: string) {
	return path.replace(/\/+$/, '');
}

export function toUtcString(date: string) {
	return new Date(date).toISOString();
}

export function md5(content: string) {
	return createHash('md5').update(content).digest('hex').slice(0, 8);
}

export function stringFromFormat(format: string, placeholders: Record<string, string>) {
	let formatResult = format;
	for (const key of Object.keys(placeholders) as Array<keyof typeof placeholders>) {
		formatResult = formatResult.replace(key, placeholders[key] ?? '');
	}
	return formatResult;
}

export function parseWithFriendlyErrors<T extends z.Schema>(
	schema: T,
	input: z.input<T>,
	message: (issues: string) => string,
): z.output<T> {
	const parsedConfig = schema.safeParse(input, { errorMap });

	if (!parsedConfig.success) {
		const issues = parsedConfig.error.issues.map((i) => `- ${i.message}`).join('\n');
		throw new Error(message(issues));
	}

	return parsedConfig.data;
}

/** Makes a string compatible with `external: true` repositories. This is necessary for reading tracked files within the external path. */
export function externalSafePath(external: boolean, cwd: string, path: string) {
	if (external) {
		return join(cwd, path);
	}
	return path;
}

export async function exists(path: string) {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
}

export async function createCache(dir: string, entry: string, hash: string) {
	const file = `${entry}.json`;
	const path = join(resolve(dir, file));

	const write = async (contents: Record<string, string>) => {
		await writeFile(
			path,
			JSON.stringify({
				__validation: hash,
				...contents,
			}),
		);
	};

	const contents = async () => await jsonLoader(path);

	const revalidate = async (hash: string) => {
		if ((await contents())?.__validation !== hash) {
			await write({});
		}
	};

	if (!(await exists(path))) {
		mkdir(resolve(dir), { recursive: true });
		await write({ __validation: hash });
	} else {
		await revalidate(hash);
	}

	return { contents, write };
}
