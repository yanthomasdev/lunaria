import { z } from 'zod';
import type { DictionaryObject } from '../types.js';

export const DictionaryContentSchema: z.ZodType<DictionaryObject> = z.record(
	z.string(),
	z.lazy(() => z.string().or(DictionaryContentSchema))
);
