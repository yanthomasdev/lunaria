import { z } from 'zod';
import { isRelative, stripTrailingSlash } from '../utils/utils.js';
import type { LunariaUserConfig, OptionalKeys } from './types.js';
import type { Consola, InputLogObject, LogType } from 'consola';

const RepositorySchema = z.object({
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

export const FileSchema = z.discriminatedUnion('type', [
	BaseFileSchema.extend({ type: z.literal('universal') }),
	BaseFileSchema.extend({
		type: z.literal('dictionary'),
		optionalKeys: OptionalKeysSchema.optional(),
	}),
]);

export const SetupOptionsSchema = z.object({
	config: z.any() as z.Schema<LunariaUserConfig>,
	updateConfig: z.function(
		z.tuple([z.record(z.any()) as z.Schema<Partial<LunariaUserConfig>>]),
		z.void(),
	),
	// Importing ConsolaInstance from 'consola' directly is not possible due to missing imports for `LogFn`
	logger: z.any() as z.Schema<
		Consola &
			Record<
				LogType,
				{
					// biome-ignore lint/suspicious/noExplicitAny: copied from Consola
					(message: InputLogObject | any, ...args: any[]): void;
					// biome-ignore lint/suspicious/noExplicitAny: copied from Consola
					raw: (...args: any[]) => void;
				}
			>
	>,
	fileLoader: z.function(z.tuple([z.string()]), z.any()),
});

const LunariaIntegrationSchema = z.object({
	name: z.string(),
	hooks: z.object({
		setup: z.function(z.tuple([SetupOptionsSchema]), z.void()).optional(),
	}),
});

// We need both of these schemas so that we can extend the Lunaria config
// e.g. to validate integrations
export const BaseLunariaConfigSchema = z.object({
	repository: RepositorySchema,
	sourceLocale: z.string(),
	locales: z.array(z.string()).nonempty(),
	files: z.array(FileSchema).nonempty(),
	tracking: z
		.object({
			ignoredKeywords: z.array(z.string()).default(['lunaria-ignore', 'fix typo']),
			localizableProperty: z.string().optional(),
		})
		.default({}),
	integrations: z.array(LunariaIntegrationSchema).default([]),
	cacheDir: z.string().default('./node_modules/.cache/lunaria'),
	cloneDir: z.string().default('./node_modules/.cache/lunaria/history'),
});

export const LunariaConfigSchema = BaseLunariaConfigSchema.superRefine((config, ctx) => {
	// Adds an validation issue if any locales share the same value.
	const locales = new Set();
	for (const locale of [config.sourceLocale, ...config.locales]) {
		if (locales.has(locale)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `Repeated \`locales\` value: \`"${locale}"\``,
			});
		}
		locales.add(locale);
	}

	if (config.cacheDir === config.cloneDir) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: '`cacheDir` and `cloneDir` should not be in the same directory',
		});
	}
});
