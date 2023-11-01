import type { TemplateResult } from 'lit-html';
import type { LunariaConfig } from './utils/config.js';

export type { Dashboard, Locale, LunariaConfig, SharedPathResolver } from './utils/config.js';

export type AugmentedFileData = FileData & AdditionalContentData;

export type FileContentIndex = Record<string, Record<string, AugmentedFileData>>;

export type ContentTypes = 'dictionary' | 'generic';

export type DictionaryObject = {
	[key: string]: string | DictionaryObject;
};

export interface IndexData {
	lang: string;
	filePath: string;
	sharedPath: string;
	fileData: FileData;
	additionalData: AdditionalContentData;
}

export interface FileData {
	filePath: string;
	isTranslatable: boolean;
	lastChange: string;
	lastCommitMessage: string;
	lastMajorChange: string;
	lastMajorCommitMessage: string;
}

interface DictionaryContentData {
	type: 'dictionary';
	optionalKeys: string[];
}

interface GenericContentData {
	type: 'generic';
}

type AdditionalContentData = DictionaryContentData | GenericContentData;

export interface GitHostingUrl {
	type?: string;
	refName?: string;
	query?: string;
	repository: string;
	filePath: string;
	rootDir: string;
}

export interface FileTranslationStatus {
	sharedPath: string;
	sourcePage: FileData;
	gitHostingUrl: string;
	translations: {
		[locale: string]: TranslationStatus;
	};
}

export interface TranslationStatus {
	file: FileData | undefined;
	completeness: {
		complete: boolean;
		missingKeys: string[] | null;
	};
	isMissing: boolean;
	isOutdated: boolean;
	gitHostingUrl: string;
	sourceHistoryUrl: string;
}

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
