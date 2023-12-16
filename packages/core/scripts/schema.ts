import { writeFileSync } from 'node:fs';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { LunariaConfigSchema } from '../src/schemas/config.js';

const jsonSchema = JSON.stringify(
	zodToJsonSchema(LunariaConfigSchema, 'LunariaConfigSchema'),
	null,
	2
);

writeFileSync('./config.schema.json', jsonSchema);

console.log('Lunaria JSON schema generated!');
