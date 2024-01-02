import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { rehype } from 'rehype';
import rehypeFormat from 'rehype-format';
import type { LocalizationStatus, LunariaConfig, LunariaRendererConfig } from '../types.js';
import { Page } from './components.js';

export async function generateDashboard(
	config: LunariaConfig,
	rendererConfig: LunariaRendererConfig | undefined,
	status: LocalizationStatus[]
) {
	const result = render(Page(config, rendererConfig, status));
	const html = await rehype()
		.use(rehypeFormat)
		.process(await collectResult(result));
	return String(html);
}
