import type { MatchResult } from 'path-to-regexp';
import type { OptionalKeys } from './config/schemas.js';

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

export type * from './config/schemas.js';
export type * from './dashboard/schemas.js';
export type * from './status/schemas.js';

export type AugmentedFileData = FileData & FileMeta;
export type ContentIndex = Record<string, Record<string, AugmentedFileData>>;

export type IndexData = {
	lang: string;
	sharedPath: string;
	fileData: FileData;
	meta: FileMeta;
};

export type FileData = {
	filePath: string;
	isLocalizable: boolean;
	lastChange: string;
	lastCommitMessage: string;
	lastMajorChange: string;
	lastMajorCommitMessage: string;
};

export type GitHostingURL = {
	type?: string;
	refName?: string;
	query?: string;
	repository: string;
	filePath?: string;
	rootDir: string;
};

export type LocalizationStatus = {
	sharedPath: string;
	sourceFile: FileData;
	gitHostingFileURL: string | null;
	localizations: {
		[locale: string]: FileStatus;
	};
};

export type FileStatus = {
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

export type Status = 'done' | 'outdated' | 'missing';

export type RegExpGroups<T extends string> =
	| (RegExpMatchArray & {
			groups?: { [name in T]: string } | { [key: string]: string };
	  })
	| null;

export type Dictionary = {
	[key: string]: string | Dictionary;
};
