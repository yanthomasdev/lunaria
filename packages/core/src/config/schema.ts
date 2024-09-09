import { z } from 'zod';
import { isRelative, stripTrailingSlash } from '../utils/utils.js';
import type { OptionalKeys } from './types.js';

// TODO: Move types into separate file, Zod has a few issues with more complex types.
const RepositorySchema = z.preprocess(
	(val) => {
		if (typeof val === 'string') {
			return { name: val };
		}
		return val;
	},
	z.union([
		z.string(),
		z.object({
			name: z.string().transform((path) => stripTrailingSlash(path)),
			branch: z.string().default('main'),
			rootDir: z
				.string()
				.default('.')
				.refine((path) => !isRelative(path), {
					message:
						'The root directory should not be a relative path, it should follow the example: `examples/vitepress`',
				})
				// TODO: See if this transform is even necessary still?
				.transform((path) => stripTrailingSlash(path)),
			hosting: z.union([z.literal('github'), z.literal('gitlab')]).default('github'),
		}),
	]),
);

const LocaleSchema = z.object({
	label: z.string(),
	lang: z.string(),
});

const BaseFileSchema = z.object({
	include: z.array(z.string()).nonempty(),
	exclude: z.array(z.string()).default(['node_modules']),
	pattern: z.union([
		z.string(),
		z.object({
			source: z.string(),
			locales: z.string(),
		}),
	]),
});

const OptionalKeysSchema: z.ZodType<OptionalKeys> = z.lazy(() =>
	z.record(z.string(), z.union([z.boolean(), OptionalKeysSchema])),
);

const FileSchema = z.discriminatedUnion('type', [
	BaseFileSchema.extend({ type: z.literal('universal') }),
	BaseFileSchema.extend({
		type: z.literal('dictionary'),
		optionalKeys: OptionalKeysSchema.optional(),
	}),
]);

export const LunariaConfigSchema = z
	.object({
		repository: RepositorySchema,
		sourceLocale: LocaleSchema,
		locales: z.array(LocaleSchema).nonempty(),
		files: z.array(FileSchema).nonempty(),
		tracking: z
			.object({
				ignoredKeywords: z.array(z.string()).default(['lunaria-ignore', 'fix typo']),
				localizableProperty: z.string().optional(),
			})
			.default({}),
		// TODO: Add validation for Lunaria integrations
		/*integrations: z
			.array(
				z.object({
					name: z.string(),
					hooks: z.object({}).passthrough().default({}),
				}),
			)
			.default([]),*/
		cacheDir: z.string().default('./node_modules/.cache/lunaria'),
		cloneDir: z.string().default('./node_modules/.cache/lunaria/history'),
	})
	.superRefine((config, ctx) => {
		// Adds an validation issue if any locales share the same lang.
		const allLocales = [...config.locales.map(({ lang }) => lang), config.sourceLocale.lang];
		const uniqueLocales = new Set(allLocales);

		if (allLocales.length !== uniqueLocales.size) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'All locales should have a unique `lang` value',
			});
		}

		if (config.cacheDir === config.cloneDir) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: '`cacheDir` and `cloneDir` should not be in the same directory',
			});
		}
	});
