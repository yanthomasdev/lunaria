import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import consola from 'consola';
import { runSetupHook } from '../../dist/integrations/integrations.js';
import { validateFinalConfig } from '../../src/config/config.js';
import type { CompleteLunariaUserConfig } from '../../src/integrations/types.js';
import { sampleValidConfig } from '../utils.js';

describe('Integration setup hook', () => {
	it("should throw if it tries to update the config's `integrations` field", () => {
		const sampleIntegration = {
			name: '@lunariajs/test',
			hooks: { setup: ({ updateConfig }) => updateConfig({ integrations: [] }) },
		};

		assert.throws(() =>
			runSetupHook(
				{
					...sampleValidConfig,
					integrations: [sampleIntegration],
				},
				consola,
			),
		);
	});

	it('should successfully update the configuration', () => {
		const addedConfigFields = {
			sourceLocale: 'en',
			locales: ['es', 'fr', 'ja'],
			files: [
				{
					include: ['src/content/**/*.mdx'],
					pattern: 'src/content/@lang/@path',
					type: 'universal',
				},
			],
		};

		const sampleIntegration = {
			name: '@lunariajs/test',
			hooks: { setup: ({ updateConfig }) => updateConfig(addedConfigFields) },
		};

		// Here we ignore `integrations` since it causes an nasty non-reference equality error.
		const { integrations, ...resultingConfig } = runSetupHook(
			{
				repository: {
					name: 'yanthomasdev/lunaria',
				},
				integrations: [sampleIntegration],
			},
			consola,
		);

		const { integrations: _, ...expectedConfig } = validateFinalConfig({
			repository: {
				name: 'yanthomasdev/lunaria',
			},
			...addedConfigFields,
		} as CompleteLunariaUserConfig);

		assert.deepEqual(resultingConfig, expectedConfig);
	});
});
