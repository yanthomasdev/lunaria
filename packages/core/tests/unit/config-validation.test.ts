import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { validateFinalConfig, validateInitialConfig } from '../../dist/config/config.js';
import { sampleValidConfig } from '../utils.js';

describe('Configuration validation', () => {
	it('should throw when invalid', () => {
		// @ts-expect-error - Testing invalid config
		assert.throws(() => validateFinalConfig({ foo: 'bar' }));
	});

	it('should throw when there are repeated locales', () => {
		assert.throws(() => validateFinalConfig({ ...sampleValidConfig, locales: ['en'] }));
	});

	it('should accept unset `sourceLocale`, `locales`, and `files` before setup hook', () => {
		assert.doesNotThrow(() =>
			validateInitialConfig({
				...sampleValidConfig,
				files: undefined,
				locales: undefined,
				sourceLocale: undefined,
			}),
		);
	});

	it("should throw when `sourceLocale`, `locales`, and `files` aren't set after setup hook", () => {
		assert.throws(() =>
			validateFinalConfig({
				...sampleValidConfig,
				files: undefined,
				locales: undefined,
				sourceLocale: undefined,
			}),
		);
	});

	it('should not accept relative paths in rootDir property', () => {
		assert.throws(() =>
			validateFinalConfig({
				...sampleValidConfig,
				repository: { name: 'yanthomasdev/lunaria', rootDir: './examples/starlight/' },
			}),
		);
	});

	it('should remove trailing slashes from repository properties', () => {
		const resultingConfig = validateFinalConfig({
			...sampleValidConfig,
			repository: {
				name: 'yanthomasdev/lunaria/',
				rootDir: 'examples/starlight/',
			},
		});

		assert.equal(resultingConfig.repository.name, 'yanthomasdev/lunaria');
		assert.equal(resultingConfig.repository.rootDir, 'examples/starlight');
	});
});
