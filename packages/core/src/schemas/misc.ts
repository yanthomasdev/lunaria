import { z } from 'zod';
import type { DictionaryObject } from '../types.js';

export const SharedPathResolverSchema = z
	.function()
	.args(
		z.object({
			lang: z.string(),
			filePath: z.string(),
		})
	)
	.returns(z.string())
	.optional()
	.describe(
		'Custom fuction to handle the shared path resolver, used to "link" pages between two locales.'
	);

export const DictionaryContentSchema: z.ZodType<DictionaryObject> = z.record(
	z.string(),
	z.lazy(() => z.string().or(DictionaryContentSchema))
);

export type SharedPathResolver = z.infer<typeof SharedPathResolverSchema>;
