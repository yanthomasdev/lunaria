import pc from 'picocolors';

/** Universal */
export function error(message: string) {
	const badge = pc.red('[error]');
	const headline = pc.red(message);

	return `${badge} ${headline}`;
}

export function info(message: string) {
	const badge = pc.cyan('[info]');

	return `${badge} ${message}`;
}

export function warn(message: string) {
	const badge = pc.yellow('[warn]');

	return `${badge} ${message}`;
}

export function success(message: string) {
	return pc.green(`✓ ${message}`);
}

export function failure(message: string) {
	return pc.red(`✕ ${message}`);
}

export function highlight(message: string) {
	return pc.blue(message);
}

export function bold(message: string) {
	return pc.bold(message);
}

export function code(message: string) {
	return pc.italic(pc.white(message));
}

/** Command-specific */
export function build(message: string) {
	const badge = pc.magenta('[build]');

	return `${badge} ${message}`;
}

export function sync(message: string) {
	const badge = pc.blue('[sync]');

	return `${badge} ${message}`;
}
