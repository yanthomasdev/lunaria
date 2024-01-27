import { ConfirmPrompt, SelectPrompt, TextPrompt } from '@clack/core';
import pc from 'picocolors';

export { isCancel } from '@clack/core';

export function text(opts: {
	message: string;
	placeholder?: string;
	defaultValue?: string;
	initialValue?: string;
	validate?: (value: string) => string | void;
}) {
	return new TextPrompt({
		validate: opts.validate,
		placeholder: opts.placeholder,
		defaultValue: opts.defaultValue,
		initialValue: opts.initialValue,
		render() {
			const title = `${opts.message}\n`;
			const placeholder = opts.placeholder
				? pc.inverse(opts.placeholder[0]) + pc.dim(opts.placeholder.slice(1))
				: pc.inverse(pc.hidden('_'));
			const value = !this.value ? placeholder : this.valueWithCursor;

			switch (this.state) {
				case 'error':
					return `${title.trim()}\n  ${value}\n  ${pc.yellow(this.error)}\n`;
				case 'submit':
					return `${title}  ${pc.dim(this.value || opts.placeholder)}`;
				case 'cancel':
					return `${title}  ${pc.strikethrough(pc.dim(this.value ?? ''))}${
						this.value?.trim() ? '\n' : ''
					}`;
				default:
					return `${title}  ${value}\n\n`;
			}
		},
	}).prompt() as Promise<string | symbol>;
}

export function select(opts: {
	options: { value: string; label?: string }[];
	message: string;
	initialValue?: string;
}) {
	const opt = (
		option: { value: string; label?: string },
		state: 'inactive' | 'active' | 'selected' | 'cancelled'
	) => {
		const label = option.label ?? option.value;
		switch (state) {
			case 'selected':
				return `${pc.dim(label)}`;
			case 'active':
				return `${pc.green('>')} ${label}`;
			case 'cancelled':
				return `${pc.strikethrough(pc.dim(label))}`;
			default:
				return `${pc.dim(pc.hidden('__') + label)}`;
		}
	};

	return new SelectPrompt({
		options: opts.options,
		initialValue: opts.initialValue,
		render() {
			const title = `${opts.message}\n`;
			const allOptions = this.options
				.map((option, i) => `${opt(option, i === this.cursor ? 'active' : 'inactive')}`)
				.join('\n');

			switch (this.state) {
				case 'submit':
					return `${title}  ${opt(this.options[this.cursor]!, 'selected')}`;
				case 'cancel':
					return `${title}  ${opt(this.options[this.cursor]!, 'cancelled')}\n`;
				default: {
					return `${title}    ${allOptions}\n\n`;
				}
			}
		},
	}).prompt() as Promise<string | symbol>;
}

export function confirm(opts: { message: string; initialValue?: boolean }) {
	const active = 'Yes';
	const inactive = 'No';

	return new ConfirmPrompt({
		active,
		inactive,
		initialValue: opts.initialValue ?? true,
		render() {
			const title = `${opts.message}\n`;
			const value = this.value ? active : inactive;

			switch (this.state) {
				case 'submit':
					return `${title} ${pc.dim(value)}`;
				case 'cancel':
					return `${title} ${pc.strikethrough(pc.dim(value))}\n`;
				default: {
					return `${title} ${
						this.value
							? `${pc.green('>')} ${active}`
							: `${!this.value ? pc.hidden('__') : ''}${pc.dim(active)}`
					}\n${
						!this.value
							? `${pc.green('>')} ${inactive}`
							: `${this.value ? pc.hidden('__') : ''}${pc.dim(inactive)}`
					}\n\n`;
				}
			}
		},
	}).prompt() as Promise<boolean | symbol>;
}

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

export function init(message: string) {
	const badge = pc.cyan('[init]');

	return `${badge} ${message}`;
}
