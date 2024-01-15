export type Command = { name: string; description: string; usage: string; options?: Option[] };

export type Option = { name: string; description: string };

export type CLI = {
	commands: Command[];
	options: Option[];
};

export type GlobalOptions = {
	config: string | undefined;
};

export type BuildOptions = GlobalOptions & {
	'skip-status': boolean | undefined;
};

export type SyncOptions = GlobalOptions & {
	package: string | undefined;
	'skip-questions': boolean | undefined;
};

export type PackageJson = {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
};
