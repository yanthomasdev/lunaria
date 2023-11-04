import type { TemplateResult } from 'lit-html';
import type { LunariaConfig } from './schemas/config.js';
import type { OptionalKeys } from './schemas/locale.js';

type DictionaryContentData = {
	type: 'dictionary';
	optionalKeys: OptionalKeys;
};

type GenericContentData = {
	type: 'generic';
};

type AdditionalContentData = DictionaryContentData | GenericContentData;

export type * from './schemas/config.js';
export type * from './schemas/dashboard.js';
export type * from './schemas/locale.js';
export type * from './schemas/misc.js';

export type AugmentedFileData = FileData & AdditionalContentData;
export type FileContentIndex = Record<string, Record<string, AugmentedFileData>>;

export type IndexData = {
	lang: string;
	filePath: string;
	sharedPath: string;
	fileData: FileData;
	additionalData: AdditionalContentData;
};

export type FileData = {
	filePath: string;
	isTranslatable: boolean;
	lastChange: string;
	lastCommitMessage: string;
	lastMajorChange: string;
	lastMajorCommitMessage: string;
};

export type GitHubURL = {
	type?: string;
	refName?: string;
	query?: string;
	repository: string;
	filePath?: string;
	rootDir: string;
};

export type FileTranslationStatus = {
	sharedPath: string;
	sourcePage: FileData;
	gitHubURL: string;
	translations: {
		[locale: string]: TranslationStatus;
	};
};

export type TranslationStatus = {
	file: FileData | undefined;
	completeness: {
		complete: boolean;
		missingKeys: string[] | null;
	};
	isMissing: boolean;
	isOutdated: boolean;
	gitHubURL: string;
	sourceHistoryURL: string;
};

export type RegExpGroups<T extends string> =
	| (RegExpMatchArray & {
			groups?: { [name in T]: string } | { [key: string]: string };
	  })
	| null;

export type CustomComponent = (opts: LunariaConfig) => TemplateResult<1>;

export type CustomStatusComponent = (
	opts: LunariaConfig,
	translationStatus: FileTranslationStatus[]
) => TemplateResult<1>;

export type DictionaryObject = {
	[key: string]: string | DictionaryObject;
};
