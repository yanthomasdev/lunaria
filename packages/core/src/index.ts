import type { LunariaUserRendererConfig } from './types.js';

export { html } from 'lit-html';
export type * from './types.js';

export function defineRendererConfig(opts: LunariaUserRendererConfig) {
	return opts;
}
