import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { validateConfig } from '../../dist/config/config.js';
import { sampleValidConfig } from '../utils.js';

describe('Configuration validation', () => {
	it('should throw when invalid', () => {
		// @ts-expect-error - Testing invalid config
		assert.throws(() => validateConfig({ foo: 'bar' }));
	});

	it('should not accept repeated lang values', () => {
		assert.throws(() =>
			validateConfig({ ...sampleValidConfig, locales: [{ lang: 'en', label: 'English' }] }),
		);
	});

	it('should not accept relative paths in rootDir property', () => {
		assert.throws(() =>
			validateConfig({
				...sampleValidConfig,
				repository: { name: 'yanthomasdev/lunaria', rootDir: './examples/starlight/' },
			}),
		);
	});

	it('should preprocess repository string into object with default values', () => {
		const resultingConfig = validateConfig({
			...sampleValidConfig,
			repository: 'yanthomasdev/lunaria',
		});

		assert.deepEqual(resultingConfig.repository, {
			name: 'yanthomasdev/lunaria',
			branch: 'main',
			rootDir: '.',
			hosting: 'github',
		});
	});

	it('should remove trailing slashes from repository properties', () => {
		const resultingConfig = validateConfig({
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
