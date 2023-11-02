import type { LunariaUserConfig } from './types.js';

export { html } from 'lit-html';
export type * from './types.js';

export function defineConfig(opts: LunariaUserConfig) {
	return opts;
}
