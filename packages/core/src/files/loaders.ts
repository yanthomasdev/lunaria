import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createJiti } from 'jiti';
import { parse } from 'ultramatter';
import { FailedToLoadModule } from '../errors/errors.js';

/** Regex to match ESM and CJS JavaScript/TypeScript files. */
export const moduleFileRe = /\.(c|m)?(ts|js)$/;
/** Loader for JavaScript/TypeScript modules (CJS, ESM). */
export async function moduleLoader(path: string) {
	const resolvedPath = resolve(path);
	const jiti = createJiti(import.meta.url);

	try {
		return await jiti.import(resolvedPath, { default: true });
	} catch (e) {
		FailedToLoadModule.message(resolvedPath);
	}
}

/** Regex to match files that support frontmatter. */
export const fileSupportsFrontmatterRe = /\.(yml|md|markdown|mdx|mdoc)$/;
/** Loader for frontmatter in `.yml`, `.md`, `.markdown`, `.mdx`, `.mdoc`. */
export async function frontmatterLoader(path: string) {
	const resolvedPath = resolve(path);

	try {
		const file = await readFile(resolvedPath, 'utf-8');
		const frontmatter = parse(file).frontmatter;

		return frontmatter;
	} catch (e) {
		if (e instanceof Error) return e;
	}
}

/** Regex to match JSON files. */
export const jsonFileRe = /\.json$/;
/** Loader for JSON files. */
export async function jsonLoader(path: string) {
	const resolvedPath = resolve(path);

	try {
		const file = await readFile(resolvedPath, 'utf-8');
		return JSON.parse(file);
	} catch (e) {
		if (e instanceof Error) return e;
	}
}

/** Loader for JS/TS modules, JSON, and frontmatter.  */
export async function fileLoader(path: string) {
	if (moduleFileRe.test(path)) return await moduleLoader(path);
	if (fileSupportsFrontmatterRe.test(path)) return await frontmatterLoader(path);
	if (jsonFileRe.test(path)) return jsonLoader(path);
}
