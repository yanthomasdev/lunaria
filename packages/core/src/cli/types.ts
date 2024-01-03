export type Command = { name: string; description: string; usage: string; options?: Option[] };

export type Option = { name: string; description: string };

export type CLI = {
	commands: Command[];
	options: Option[];
};

export type BuildOptions = {
	config: string | undefined;
	'skip-status': boolean | undefined;
};
