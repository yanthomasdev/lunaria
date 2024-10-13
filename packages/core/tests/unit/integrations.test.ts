import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import consola from 'consola';
import { runSetupHook } from '../../dist/integrations/integrations.js';
import { validateFinalConfig } from '../../src/config/config.js';
import type { CompleteLunariaUserConfig } from '../../src/integrations/types.js';
import { sampleValidConfig } from '../utils.js';

describe('Integration setup hook', async () => {
	it("should throw if it tries to update the config's `integrations` field", async () => {
		const sampleIntegration = {
			name: '@lunariajs/test',
			hooks: { setup: ({ updateConfig }) => updateConfig({ integrations: [] }) },
		};

		await assert.rejects(
			async () =>
				await runSetupHook(
					{
						...sampleValidConfig,
						integrations: [sampleIntegration],
					},
					consola,
				),
			{
				name: 'Error',
				message:
					'The integration `@lunariajs/test` attempted to update the `integrations` field, which is not supported.',
			},
		);
	});

	it('should successfully update the configuration', async () => {
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
		const { integrations, ...resultingConfig } = await runSetupHook(
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

	it('should successfully resolve an async hook', async () => {
		const sampleIntegration = {
			name: '@lunariajs/test',
			hooks: {
				setup: async ({ updateConfig }) =>
					new Promise<void>((resolve) => {
						setTimeout(() => {
							resolve(updateConfig({ locales: ['es', 'pt'] }));
						}, 200);
					}),
			},
		};

		const { integrations, ...expectedConfig } = validateFinalConfig({
			...sampleValidConfig,
			locales: ['es', 'pt'],
		});

		const { integrations: _, ...resultingConfig } = await runSetupHook(
			{
				...sampleValidConfig,
				integrations: [sampleIntegration],
			},
			consola,
		);

		assert.deepEqual(resultingConfig, expectedConfig);
	});
});
