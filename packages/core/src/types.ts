import type { TemplateResult } from 'lit';
import type { MatchResult } from 'path-to-regexp';
import type { LunariaConfig, OptionalKeys } from './schemas/config.js';

type PathResolver = {
	isMatch: (path: string) => MatchResult;
	toLocalePath: (path: string, lang: string) => string;
	toSharedPath: (path: string) => string;
};

type BaseFileMeta = {
	pathResolver: PathResolver;
};

type DictionaryFileMeta = {
	type: 'dictionary';
	optionalKeys?: OptionalKeys;
};

type UniversalFileMeta = {
	type: 'universal';
};

export type FileMeta = BaseFileMeta & (DictionaryFileMeta | UniversalFileMeta);

export type * from './schemas/config.js';
export type * from './schemas/dashboard.js';
export type * from './schemas/misc.js';

export type AugmentedFileData = FileData & FileMeta;
export type FileContentIndex = Record<string, Record<string, AugmentedFileData>>;

export type IndexData = {
	lang: string;
	sharedPath: string;
	fileData: FileData;
	meta: FileMeta;
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
	sourceFile: FileData;
	gitHostingFileURL: string | null;
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
	gitHostingFileURL: string | null;
	gitHostingHistoryURL: string | null;
};

export type RegExpGroups<T extends string> =
	| (RegExpMatchArray & {
			groups?: { [name in T]: string } | { [key: string]: string };
	  })
	| null;

export type CustomComponent = (opts: LunariaConfig) => TemplateResult;

export type CustomStatusComponent = (
	opts: LunariaConfig,
	translationStatus: FileTranslationStatus[]
) => TemplateResult;

export type DictionaryObject = {
	[key: string]: string | DictionaryObject;
};

export type FrontmatterFromFile = {
	frontmatter: Record<string, any> | undefined;
	context: 'found' | 'not supported';
};

export type FrontmatterProperty = {
	property: any;
	context: 'found' | 'not found' | 'not supported';
};
