import type { LunariaUserRendererConfig } from './types.js';

export { nothing } from 'lit';
export { html, svg, unsafeStatic } from 'lit/static-html.js';

export type * from './types.js';

export function defineRendererConfig(opts: LunariaUserRendererConfig) {
	return opts;
}
