import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
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
