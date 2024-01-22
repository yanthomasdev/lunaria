import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { LunariaConfigSchema } from '../src/config/index.js';

const schema = JSON.stringify(zodToJsonSchema(LunariaConfigSchema, 'LunariaConfigSchema'), null, 2);

writeFileSync(resolve('./config.schema.json'), schema);

console.log('Lunaria JSON schema generated!');
