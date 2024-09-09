import type { z } from 'zod';
import { ConfigValidationError } from './errors.js';
import { errorMap } from './zod-map.js';

export function parseWithFriendlyErrors<T extends z.Schema>(
	schema: T,
	input: z.input<T>,
): z.output<T> {
	const parsedConfig = schema.safeParse(input, { errorMap });

	if (!parsedConfig.success) {
		const issues = parsedConfig.error.issues.map((i) => `- ${i.message}`).join('\n');
		throw new Error(ConfigValidationError.message(issues));
	}

	return parsedConfig.data;
}
