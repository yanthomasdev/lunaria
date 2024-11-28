import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createJiti } from 'jiti';
import yaml from 'js-yaml';
import { parse } from 'ultramatter';
import { FailedToLoadModule } from '../errors/errors.js';

// TODO: Consider moving this out of the loaders file and directly into the public utils API.

/** Regex to match ESM and CJS JavaScript/TypeScript files. */
export const moduleFileRe = /\.(c|m)?(ts|js)$/;
/** Loader for JavaScript/TypeScript modules (CJS, ESM). */
export async function loadModule(path: string) {
	const resolvedPath = resolve(path);
	const jiti = createJiti(import.meta.url);

	try {
		return await jiti.import(resolvedPath, { default: true });
	} catch (e) {
		FailedToLoadModule.message(resolvedPath);
	}
}

/** Regex to match files that support frontmatter. */
export const frontmatterFileRe = /\.(md|markdown|mdx|mdoc)$/;
/** Loader for frontmatter in `.md`, `.markdown`, `.mdx`, `.mdoc`. */
export async function loadFrontmatter(path: string) {
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
export async function loadJSON(path: string) {
	const resolvedPath = resolve(path);

	try {
		const file = await readFile(resolvedPath, 'utf-8');
		return JSON.parse(file);
	} catch (e) {
		if (e instanceof Error) return e;
	}
}

export const yamlFileRe = /\.(yml|yaml)$/;
/** Loader for YAML files. */
export async function loadYAML(path: string) {
	const resolvedPath = resolve(path);

	try {
		const file = await readFile(resolvedPath, 'utf-8');
		return yaml.load(file);
	} catch (e) {
		if (e instanceof Error) return e;
	}
}
