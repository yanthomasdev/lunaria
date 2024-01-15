import type { OptionalKeys } from './config/schemas.js';

export type * from './config/schemas.js';
export type * from './dashboard/schemas.js';
export type * from './status/schemas.js';

export type GitHistory = {
	lastChange: string;
	lastCommitMessage: string;
	lastMajorChange: string;
	lastMajorCommitMessage: string;
};

export type GitHosting = {
	gitHostingFileURL: string;
	gitHostingHistoryURL: string;
};

export type FileData = {
	path: string;
	isLocalizable: boolean;
	git: GitHistory;
};

export type FileIndex = Record<string, Record<string, IndexEntry>>;

export type IndexEntry = FileData &
	GitHosting & {
		lang: string;
		sharedPath: string;
		pattern: string;
		meta: SourceFileMeta;
	};

export type LocalizationStatus = {
	sharedPath: string;
	sourceFile: SourceFileData;
	localizations: {
		[locale: string]: LocalizationFileData;
	};
};

export type SourceFileMeta =
	| {
			type: 'universal';
	  }
	| {
			type: 'dictionary';
			optionalKeys?: OptionalKeys;
	  };

export type SourceFileData = GitHosting & {
	lang: string;
	path: string;
	pattern: string;
	isLocalizable: boolean;
	git: GitHistory;
	meta: SourceFileMeta;
};

export type LocalizationFileMeta =
	| {
			type: 'universal';
	  }
	| {
			type: 'dictionary';
			missingKeys: string[];
	  };

export type LocalizationFileData =
	| (GitHosting & {
			isMissing: true;
	  })
	| (GitHosting & {
			lang: string;
			path: string;
			pattern: string;
			isLocalizable: boolean;
			git: GitHistory;
			meta: LocalizationFileMeta;
			isMissing: false;
			isOutdated: boolean;
	  });

export type Status = 'done' | 'outdated' | 'missing';

export type RegExpGroups<T extends string> =
	| (RegExpMatchArray & {
			groups?: { [name in T]: string } | { [key: string]: string };
	  })
	| null;

export type Dictionary = {
	[key: string]: string | Dictionary;
};
