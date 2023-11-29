import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { LunariaConfigSchema } from '../src/schemas/config.js';

const mergedSchema = LunariaConfigSchema.merge(
	z
		.object({
			$schema: z.string().optional(),
		})
		.describe('A path or URL to a valid Lunaria JSON Schema.')
);

const jsonSchema = JSON.stringify(zodToJsonSchema(mergedSchema, 'LunariaConfigSchema'));

writeFileSync('./dist/config.schema.json', jsonSchema);

console.log('Lunaria JSON schema generated!');
