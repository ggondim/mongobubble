/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-shadow */

import { Document } from 'bson';
import { IRepositoryPlugin } from './RepositoryPlugin';
import JsonSchemaValidationPlugin from './JsonSchemaValidationPlugin';

export enum DEFAULT_PLUGINS {
  JsonSchemaValidationPlugin = 'JsonSchemaValidationPlugin',
}

export function initializePlugins(
  plugins: DEFAULT_PLUGINS[],
  options?: Document,
): IRepositoryPlugin[] {
  const result = [] as IRepositoryPlugin[];
  for (let i = 0; i < plugins.length; i++) {
    const pluginName = plugins[i];
    switch (pluginName) {
      case DEFAULT_PLUGINS.JsonSchemaValidationPlugin:
        result.push(new JsonSchemaValidationPlugin(options));
        break;
      default:
        break;
    }
  }
  return result;
}

export function getPluginHooks<THook>(hook: string, plugins: IRepositoryPlugin[]): THook[] {
  return plugins
    .filter(plugin => !!plugin[hook])
    .map(plugin => plugin[hook] as THook);
}

export async function callPluginHooks<T>(
  hookName: string,
  plugins: IRepositoryPlugin[],
  callback: (hook: T) => Promise<void>,
) {
  const hooks = getPluginHooks<T>(hookName, plugins);
  for (let i = 0; i < hooks.length; i++) {
    const hook = hooks[i];
    await callback(hook);
  }
}
