import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { error } from '../cli/messages.js';
import type { Dashboard } from '../types.js';

export function readAsset(path: string) {
	const resolvedPath = resolve(path);

	if (!existsSync(resolvedPath)) {
		console.error(error(`Could not find asset file at ${resolvedPath}. Does it exist?`));
		process.exit(1);
	}

	const asset = readFileSync(resolvedPath, 'utf-8');
	return asset;
}

export function getCollapsedPath(dashboard: Dashboard, path: string) {
	const { basesToHide } = dashboard;

	if (!basesToHide) return path;

	for (const base of basesToHide) {
		const newPath = path.replace(base, '');

		if (newPath === path) continue;
		return newPath;
	}

	return path;
}

export function inlineCustomCssFiles(customCssPaths: Dashboard['customCss']) {
	if (!customCssPaths) return null;

	const inlinedCss = customCssPaths.map((path) => {
		const css = readAsset(path);
		return css;
	});

	return inlinedCss;
}
