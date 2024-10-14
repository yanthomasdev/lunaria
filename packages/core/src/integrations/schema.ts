import { z } from 'zod';
import { BaseLunariaConfigSchema, FileSchema } from '../config/schema.js';

export const LunariaPreSetupSchema = BaseLunariaConfigSchema.extend({
	sourceLocale: z.string().optional(),
	locales: z.array(z.string()).nonempty().optional(),
	files: z.array(FileSchema).nonempty().optional(),
});
