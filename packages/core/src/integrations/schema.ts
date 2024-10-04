import { z } from 'zod';
import type { LunariaUserConfig } from '../config/types.js';
import type { Consola, InputLogObject, LogType } from 'consola';
import { BaseLunariaConfigSchema, FileSchema } from '../config/schema.js';

export const LunariaPreSetupSchema = BaseLunariaConfigSchema.extend({
	sourceLocale: z.string().optional(),
	locales: z.array(z.string()).nonempty().optional(),
	files: z.array(FileSchema).nonempty().optional(),
});
