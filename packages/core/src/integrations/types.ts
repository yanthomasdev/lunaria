import type { ConsolaInstance } from 'consola';
import type { LunariaUserConfig, File } from '../config/types.js';

export interface LunariaIntegration {
	name: string;
	hooks: {
		setup?: (options: {
			config: LunariaUserConfig;
			updateConfig: (config: Partial<LunariaUserConfig>) => void;
			logger: ConsolaInstance;
			fileLoader: (path: string) => unknown;
		}) => void;
	};
}

// This type exists to ensure it's a Lunaria user config that has all necessary fields.
// We use this to improve types for the Lunaria config during the setup hook.
export interface CompleteLunariaUserConfig extends LunariaUserConfig {
	sourceLocale: string;
	locales: [string, ...string[]];
	files: [File, ...File[]];
}