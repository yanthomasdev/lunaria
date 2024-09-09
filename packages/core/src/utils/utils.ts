import { createHash } from 'node:crypto';

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
