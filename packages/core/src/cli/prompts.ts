import { ConfirmPrompt, SelectPrompt, isCancel } from '@clack/core';
import pc from 'picocolors';
import { failure } from './messages.js';

export function handleCancel(
	value: (string | number | boolean) | symbol,
	message: string = 'Operation cancelled.'
) {
	if (isCancel(value)) {
		console.log(failure(message));
		process.exit(0);
	}
}

export function select(opts: {
	options: { value: string }[];
	message: string;
	initialValue?: string;
}) {
	const opt = (
		option: { value: string },
		state: 'inactive' | 'active' | 'selected' | 'cancelled'
	) => {
		const label = option.value;
		switch (state) {
			case 'selected':
				return `Selected: ${pc.dim(label)}\n`;
			case 'active':
				return `${pc.green('>')} ${label}`;
			case 'cancelled':
				return `${pc.strikethrough(pc.dim(label))}`;
			default:
				return `${pc.dim(label)}`;
		}
	};

	return new SelectPrompt({
		options: opts.options,
		initialValue: opts.initialValue,
		render() {
			const title = `${opts.message}\n\n`;
			const allOptions = this.options
				.map((option, i) => `${opt(option, i === this.cursor ? 'active' : 'inactive')}`)
				.join('\n');

			switch (this.state) {
				case 'submit':
					return `${title}  ${opt(this.options[this.cursor]!, 'selected')}`;
				case 'cancel':
					return `${title}  ${opt(this.options[this.cursor]!, 'cancelled')}\n`;
				default: {
					return `${title}  ${allOptions}\n\n`;
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
			const title = `${opts.message}`;
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
							: ` ${!this.value ? ' ' : ''}${pc.dim(active)}`
					} ${pc.dim('/')} ${
						!this.value
							? `${pc.green('>')} ${inactive}`
							: ` ${this.value ? ' ' : ''}${pc.dim(inactive)}`
					}\n\n`;
				}
			}
		},
	}).prompt() as Promise<boolean | symbol>;
}
