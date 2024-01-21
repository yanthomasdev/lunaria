import type { StarlightPlugin } from '@astrojs/starlight/types';
import {
	loadConfig,
	readConfig,
	writeConfig,
	type Locale,
	type LunariaUserConfig,
} from '@lunariajs/core/config';
import { handleShallowRepo } from '@lunariajs/core/git';
import type { ViteUserConfig } from 'astro';
import { z } from 'astro/zod';

const LunariaStarlightConfigSchema = z
	.object({
		/**
		 * A relative path to your Lunaria configuration file.
		 *
		 * @default './lunaria.config.json'
		 */
		configPath: z.string().default('./lunaria.config.json'),
		/**
		 * The desired route to render the Lunaria dashboard.
		 *
		 * @default '/lunaria'
		 */
		route: z.string().default('/lunaria'),
		/**
		 * Option to enables syncing the Lunaria configuration file
		 * with Starlight's configuration whenever you run
		 * `astro build`, populating the Lunaria config's `defaultLocale`,
		 * `locales`, and `files` fields automatically.
		 *
		 * @default false
		 */
		sync: z.boolean().default(false),
	})
	.default({});

export type LunariaStarlightConfig = z.infer<typeof LunariaStarlightConfigSchema>;
export type LunariaStarlightUserConfig = z.input<typeof LunariaStarlightConfigSchema>;

type PartialLunariaConfig = {
	files?: LunariaUserConfig['files'];
	locales?: LunariaUserConfig['locales'];
	defaultLocale?: LunariaUserConfig['defaultLocale'];
};

export default function lunariaStarlight(userConfig?: LunariaStarlightUserConfig): StarlightPlugin {
	const pluginConfig = LunariaStarlightConfigSchema.parse(userConfig);
	return {
		name: '@lunariajs/starlight',
		hooks: {
			setup: async ({ addIntegration, config, logger, command }) => {
				if (pluginConfig.sync && command === 'build') {
					if (config.locales) {
						logger.info('Syncing Lunaria configuration with Starlight...');

						const lunariaConfig: PartialLunariaConfig = await readConfig(pluginConfig.configPath);

						const starlightFilesEntry: LunariaUserConfig['files'][number] = {
							location: 'src/content/docs/**/*.{md,mdx}',
							pattern: 'src/content/docs/@lang/@path',
							type: 'universal',
						};

						// Filter out the file entry added by sync.
						const otherFiles =
							lunariaConfig?.files?.filter(
								(file: { location: string }) => file.location !== starlightFilesEntry.location
							) ?? [];

						const locEntries = Object.entries(config.locales);

						// Locales will follow their key, which is the one used in paths.
						// When a root locale is being used, the defaultLocale option is optional,
						// so you need to check for 'root' as well.
						const locales = locEntries
							.filter(([key]) => key !== 'root' && key !== config.defaultLocale)
							.map(([key, locale]) => ({
								label: locale.label,
								lang: key,
							})) as [Locale, ...Locale[]];

						const [defaultKey, defaultValue] = locEntries.find(
							([key]) => key === config.defaultLocale || key === 'root'
						)!;
						// Since the defaultLocale can be root which does not include
						// the proper path part, we infer one from the lang (required)
						// attribute when using root.
						const defaultLocale = {
							label: defaultValue.label,
							lang: defaultValue.lang?.toLowerCase() ?? defaultKey,
						};

						lunariaConfig.files = [starlightFilesEntry, ...otherFiles];
						lunariaConfig.locales = locales;
						lunariaConfig.defaultLocale = defaultLocale;

						writeConfig(pluginConfig.configPath, lunariaConfig as LunariaUserConfig);

						logger.info('Sync complete.');
					} else {
						logger.warn(
							'Sync is only supported when your Starlight config includes the locales field.'
						);
					}
				}

				const { userConfig } = await loadConfig(pluginConfig.configPath);
				const isShallowRepo = await handleShallowRepo(userConfig);

				addIntegration({
					name: '@lunariajs/starlight',
					hooks: {
						'astro:config:setup': ({ updateConfig, injectRoute }) => {
							// Add an Vite plugin to pass the @lunariajs/starlight config to components.
							updateConfig({
								vite: {
									plugins: [vitePluginLunariaStarlight(pluginConfig, isShallowRepo)],
								},
							});

							injectRoute({
								pattern: pluginConfig.route,
								entrypoint: '@lunariajs/starlight/Dashboard.astro',
							});
						},
					},
				});
			},
		},
	};
}

type VitePlugin = NonNullable<ViteUserConfig['plugins']>[number];

function vitePluginLunariaStarlight(
	pluginConfig: LunariaStarlightUserConfig,
	isShallowRepo: boolean
): VitePlugin {
	const moduleId = 'virtual:lunaria-starlight';
	const resolvedModuleId = `\0${moduleId}`;
	const moduleContent = `
	export const pluginConfig = ${JSON.stringify(pluginConfig)}
	export const isShallowRepo = ${JSON.stringify(isShallowRepo)}
	`;

	return {
		name: 'vite-plugin-lunaria-starlight',
		load(id) {
			return id === resolvedModuleId ? moduleContent : undefined;
		},
		resolveId(id) {
			return id === moduleId ? resolvedModuleId : undefined;
		},
	};
}
