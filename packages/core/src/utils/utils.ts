import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { z } from 'zod';
import { ConfigValidationError } from '../errors/errors.js';
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
		// TODO: Move the error message to be a parameter so it can be used
		// outside the configuration loading context.
		const issues = parsedConfig.error.issues.map((i) => `- ${i.message}`).join('\n');
		throw new Error(message(issues));
	}

	return parsedConfig.data;
}

export class Cache {
	#dir: string;
	#file: string;
	#path: string;
	#hash: string;

	constructor(dir: string, entry: string, hash: string) {
		this.#file = `${entry}.json`;
		this.#dir = resolve(dir);
		this.#path = join(this.#dir, this.#file);
		this.#hash = hash;

		if (!existsSync(this.#path)) {
			mkdirSync(this.#dir, { recursive: true });
			this.write({ __validation: this.#hash });
		} else {
			this.#revalidate(this.#hash);
		}
	}

	get contents() {
		return jsonLoader(this.#path);
	}

	write(contents: Record<string, string>) {
		writeFileSync(
			this.#path,
			JSON.stringify({
				__validation: this.#hash,
				...contents,
			}),
		);
	}

	#revalidate(hash: string) {
		if (this.contents?.__validation !== hash) {
			this.write({});
		}
	}
}
