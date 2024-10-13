import type { LunariaIntegration } from '../integrations/types.js';

export type Pattern = string | { source: string; locales: string };

type BaseFile = {
	include: [string, ...string[]];
	exclude?: string[];
	pattern: Pattern;
};

export type UniversalFileEntry = 'universal';
export type DictionaryFileEntry = 'dictionary';
export type EntryFileType = UniversalFileEntry | DictionaryFileEntry;

export type OptionalKeys = { [k: string]: boolean | OptionalKeys };

export type File =
	| (BaseFile & { type: UniversalFileEntry })
	| (BaseFile & { type: DictionaryFileEntry; optionalKeys?: OptionalKeys });

type GitHostingOptions = 'github' | 'gitlab';

export interface LunariaConfig {
	repository: {
		name: string;
		branch: string;
		rootDir: string;
		hosting: GitHostingOptions;
	};
	sourceLocale: string;
	locales: [string, ...string[]];
	files: [File, ...File[]];
	tracking: {
		ignoredKeywords: string[];
		localizableProperty?: string;
	};
	integrations: LunariaIntegration[];
	cacheDir: string;
	cloneDir: string;
}

export interface LunariaUserConfig {
	repository: {
		name: string;
		branch?: string;
		rootDir?: string;
		hosting?: 'github' | 'gitlab';
	};
	sourceLocale?: string;
	locales?: [string, ...string[]];
	files?: [File, ...File[]];
	tracking?: {
		ignoredKeywords?: string[];
		localizableProperty?: string;
	};
	integrations?: LunariaIntegration[];
	cacheDir?: string;
	cloneDir?: string;
}