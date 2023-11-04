import { z } from 'zod';
import type { DictionaryObject } from '../types.js';

export const SharedPathResolverSchema = z
	.function()
	.args(
		z.object({
			lang: z.string(),
			localePath: z.string(),
		})
	)
	.returns(z.string())
	.optional()
	.default(() => ({ lang, localePath }: { lang: string; localePath: string }) => {
		const pathParts = localePath.split('/');
		const localePartIndex = pathParts.findIndex((part) => part === lang);
		if (localePartIndex > -1) pathParts.splice(localePartIndex, 1);

		return pathParts.join('/');
	})
	.describe(
		"Fuction to extract a shared path from a locale's path, used to 'link' the content between two locales."
	);

export const LocalePathConstructorSchema = z
	.function()
	.args(
		z.object({
			sourceLang: z.string(),
			localeLang: z.string(),
			sourcePath: z.string(),
		})
	)
	.returns(z.string())
	.optional()
	.default(
		() =>
			({
				sourceLang,
				localeLang,
				sourcePath,
			}: {
				sourceLang: string;
				localeLang: string;
				sourcePath: string;
			}) => {
				const pathParts = sourcePath.split('/');
				const localePartIndex = pathParts.findIndex((part) => part === sourceLang);
				if (localePartIndex > -1) pathParts.splice(localePartIndex, 1, localeLang);

				return pathParts.join('/');
			}
	)
	.describe(
		'Fuction to construct the locale-specific path from the source path of the same content.'
	);

export const DictionaryContentSchema: z.ZodType<DictionaryObject> = z.record(
	z.string(),
	z.lazy(() => z.string().or(DictionaryContentSchema))
);

export type SharedPathResolver = z.infer<typeof SharedPathResolverSchema>;
export type LocalePathConstructor = z.infer<typeof LocalePathConstructorSchema>;
