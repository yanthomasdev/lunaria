interface ErrorContext {
	name: string;
	title: string;
	message: string | ((...context: string[]) => string);
}

export const ConfigNotFound = {
	name: 'ConfigNotFound',
	title: 'Configuration file not found.',
	message:
		'Could not find a valid JavaScript or TypeScript `lunaria.config` file. Have you created one yet?',
} satisfies ErrorContext;

export const ConfigValidationError = {
	name: 'ConfigValidationError',
	title: 'Configuration file does not match the expected schema.',
	message: (errors: string) =>
		`The configuration file does not match the expected schema. Found issues: \n${errors}`,
} satisfies ErrorContext;

export const FailedToLoadModule = {
	name: 'FailedToLoadModule',
	title: 'Failed to load module using jiti.',
	message: (path: string) =>
		`Failed to load module at \`${path}\`. This might've been caused by a syntax error in the specified file.`,
} satisfies ErrorContext;

export const InvalidFilesPattern = {
	name: 'InvalidFilesPattern',
	title: 'Invalid `files` pattern was found.',
	message: (pattern: string) =>
		`The file pattern \`${pattern}\` is missing a valid path parameter. Be sure to add at least one to your pattern string.`,
} satisfies ErrorContext;

export const FileConfigNotFound = {
	name: 'FileConfigNotFound',
	title: 'No corresponding `files` entry was found.',
	message: (path: string) =>
		`The file \`${path}\` does not match any of the existing \`files\` entries. Verify that the path is correct and a corresponding \`files\` entry is properly set in your Lunaria configuration file.`,
} satisfies ErrorContext;

export const UncommittedFileFound = {
	name: 'UncommittedFileFound',
	title: 'An uncommitted file was found.',
	message: (path: string) =>
		`The file \`${path}\` is being tracked but no commits have been found. Ensure all tracked files in your working branch are committed before running Lunaria.`,
} satisfies ErrorContext;

export const InvalidDictionaryStructure = {
	name: 'InvalidDictionaryStructure',
	title: 'A file with an invalid dictionary structure was found.',
	message: (path: string) =>
		`The \`type: "dictionary"\` file \`${path}\` has an invalid structure. Dictionaries are expected to be a recursive Record of string keys and values. Alternatively, you can track this file without key completion checking by setting it to \`type: "universal"\` instead.`,
} satisfies ErrorContext;

export const UnsupportedDictionaryFileFormat = {
	name: 'UnsupportedDictionaryFileFormat',
	title: 'An unsupported file format was found.',
	message: (file: string) =>
		`The file \`${file}\` has an unsupported file format. Dictionaries can be Markdown/MDX/Markdoc, JSON, or JavaScript/TypeScript modules. Use one of these file formats or instead track this file without key completion checking by setting it to \`type: "universal"\` instead.`,
} satisfies ErrorContext;

export const UnsupportedIntegrationSelfUpdate = {
	name: 'UnsupportedIntegrationSelfUpdate',
	title: "An integration attempted to update the configuration's `integrations` field.",
	message: (name: string) =>
		`The integration \`${name}\` attempted to update the \`integrations\` field, which is not supported.`,
} satisfies ErrorContext;
