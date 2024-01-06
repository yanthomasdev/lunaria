import type { LocalizationStatus, LunariaConfig, LunariaRendererConfig } from '../types.js';
import { Page } from './components.js';

export function html(strings: TemplateStringsArray, ...values: (string | string[])[]) {
	const treatedValues = values.map((value) => (Array.isArray(value) ? value.join('') : value));

	return String.raw({ raw: strings }, ...treatedValues);
}

export async function generateDashboard(
	config: LunariaConfig,
	rendererConfig: LunariaRendererConfig | undefined,
	status: LocalizationStatus[]
) {
	return Page(config, rendererConfig, status);
}
