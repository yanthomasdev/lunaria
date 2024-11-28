import type { LunariaUserConfig } from './config/types.js';
import type { CONSOLE_LEVELS } from './constants.js';

export interface LunariaOpts {
	logLevel?: keyof typeof CONSOLE_LEVELS;
	force?: boolean;
	config?: LunariaUserConfig;
}
