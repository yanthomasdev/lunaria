import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'ultramatter';
import { error, highlight } from '../cli/console.js';

export const frontmatterFile = /\.(yml|md|markdown|mdx|mdoc)$/;

export function getFileFrontmatter(path: string) {
	const resolvedPath = resolve(path);

	try {
		const file = readFileSync(resolvedPath, 'utf-8');
		const frontmatter = parse(file).frontmatter;

		return frontmatter;
	} catch (e) {
		console.error(error(`Failed to parse frontmatter from ${highlight(resolvedPath)}\n`));
		throw e;
	}
}
