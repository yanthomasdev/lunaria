interface ErrorContext {
	name: string;
	title: string;
	message: string | ((...context: string[]) => string);
}

export const UnknownError = {
	name: 'UnknownError',
	title: 'An unknown error occurred.',
	message:
		"An unknown error occurred. If restarting the development server or reinstalling `\node_modules` doesn't fix it, please open a GitHub issue.",
} satisfies ErrorContext;

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
		`Failed to load module at \`${path}\`. This might've been caused by syntax error in the specified file.`,
} satisfies ErrorContext;

export const InvalidFilesPattern = {
	name: 'InvalidFilesPattern',
	title: 'Invalid `files` pattern was found.',
	message: (pattern: string, parameter: string) =>
		`The file pattern \`${pattern}\` is missing the \`${parameter}\` parameter. Add it to your pattern string.`,
} satisfies ErrorContext;

export const FileConfigNotFound = {
	name: 'FileConfigNotFound',
	title: 'No corresponding `files` entry was found.',
	message: (path: string) =>
		`The file \`${path}\` doesn't not match any of the existing \`files\` entries. Verify that the path is correct and a corresponding \`files\` entry is properly set in your Lunaria configuration file.`,
} satisfies ErrorContext;

export const FileCommitsNotFound = {
	name: 'FileCommitsNotFound',
	title: 'No commits were found for the specified file.',
	message: (path: string) =>
		`No commits were found for the file \`${path}\`. Have you made any commits for this file yet?`,
} satisfies ErrorContext;

export const UncommittedFileFound = {
	name: 'UncommittedFileFound',
	title: 'An uncommitted file was found.',
	message: (path: string) =>
		`The file \`${path}\` is being tracked but has not been committed yet. Ensure all tracked files in your working branch are committed before running Lunaria.`,
} satisfies ErrorContext;

export const InvalidDictionaryFormat = {
	name: 'InvalidDictionaryFormat',
	title: 'A file with an invalid dictionary format was found.',
	message: (path: string) =>
		`The \`type: "dictionary"\` file \`${path}\` has an invalid format. Dictionaries are expected to be a recursive Record of string keys and values. Alternatively, you can track this file without key completion checking by setting it to \`type: "universal"\` instead.`,
} satisfies ErrorContext;

export const UnsupportedIntegrationSelfUpdate = {
	name: 'UnsupportedIntegrationSelfUpdate',
	title: "An integration attempted to update the configuration's `integrations` field.",
	message: (name: string) =>
		`The integration \`${name}\` attempted to update the \`integrations\` field, which is not supported.`,
} satisfies ErrorContext;
