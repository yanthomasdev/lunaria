import { z } from 'zod';
import type { Dictionary } from '../types.js';

export const DictionaryContentSchema: z.ZodType<Dictionary> = z.record(
	z.string(),
	z.lazy(() => z.string().or(DictionaryContentSchema))
);
