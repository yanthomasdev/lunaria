import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { parse } from 'ultramatter';

/** Regex to match ESM and CJS JavaScript/TypeScript files. */
export const moduleFileRe = /\.(c|m)?(ts|js)$/;
/** Loader for JavaScript/TypeScript modules (CJS, ESM). */
export function moduleLoader(path: string) {
	const resolvedPath = resolve(path);

	const require = createRequire(import.meta.url);
	const jiti = require('jiti');

	const loadFile = jiti(process.cwd(), {
		interopDefault: true,
		esmResolve: true,
	});

	return loadFile(resolvedPath);
}

/** Regex to match files that support frontmatter. */
export const fileSupportsFrontmatterRe = /\.(yml|md|markdown|mdx|mdoc)$/;
/** Loader for frontmatter in `.yml`, `.md`, `.markdown`, `.mdx`, `.mdoc`. */
export function frontmatterLoader(path: string) {
	const resolvedPath = resolve(path);

	try {
		const file = readFileSync(resolvedPath, 'utf-8');
		const frontmatter = parse(file).frontmatter;

		return frontmatter;
	} catch (e) {
		if (e instanceof Error) return e;
	}
}

/** Regex to match JSON files. */
export const jsonFileRe = /\.json$/;
/** Loader for JSON files. */
export function jsonLoader(path: string) {
	const resolvedPath = resolve(path);

	try {
		const file = JSON.parse(readFileSync(resolvedPath, 'utf-8'));
		return file;
	} catch (e) {
		if (e instanceof Error) return e;
	}
}

/** Loader for JS/TS modules, JSON, and frontmatter.  */
export function fileLoader(path: string) {
	if (moduleFileRe.test(path)) return moduleLoader(path);
	if (fileSupportsFrontmatterRe.test(path)) return frontmatterLoader(path);
	if (jsonFileRe.test(path)) return jsonLoader(path);
}
