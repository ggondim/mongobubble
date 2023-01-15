/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-shadow */

import { Document } from 'bson';
import { IRepositoryPlugin } from './IRepositoryPlugin';
import IRepository from './IRepository';
import { Complex } from './Utils';
import PreventedResult from './PreventedResult';
import JsonSchemaValidationPlugin from './plugins/jsonschema/JsonSchemaValidationPlugin';
import { RepositoryPluginConstructor, RepositoryPluginConstructorTyped } from './RepositoryPlugin';

export enum DefaultPlugins {
  JsonSchemaValidationPlugin = 'JsonSchemaValidationPlugin',
}

export function initializePlugins<TEntity>(
  repository: IRepository<TEntity>,
  plugins: DefaultPlugins[],
  options?: Document,
): IRepositoryPlugin[] {
  const result = [] as IRepositoryPlugin[];
  for (let i = 0; i < plugins.length; i++) {
    const pluginName = plugins[i];
    switch (pluginName) {
      case DefaultPlugins.JsonSchemaValidationPlugin:
        result.push(new JsonSchemaValidationPlugin(repository, options));
        break;
      default:
        break;
    }
  }
  return result;
}

export function initializeCustomPlugins<TEntity extends Document>(
  repository: IRepository<TEntity>,
  plugins: RepositoryPluginConstructor[],
  options?: Document,
): IRepositoryPlugin[] {
  if (!plugins) return [] as IRepositoryPlugin[];

  return plugins
    .map(p => (p as unknown) as RepositoryPluginConstructorTyped<TEntity>) // this is a gambiarra
    .map(P => new P(repository, options));
}

export function filterHooks(hook: string, plugins: IRepositoryPlugin[]): IRepositoryPlugin[] {
  return plugins.filter(plugin => plugin.implementedHooks().find(x => x === hook));
}

export async function callPluginHooks<T>(
  hookName: string,
  plugins: IRepositoryPlugin[],
  callback: (hook: T, plugin: IRepositoryPlugin) => Promise<void | Complex>,
): Promise<void | PreventedResult> {
  const preventedReasons = [];
  const filteredPlugins = filterHooks(hookName, plugins);
  for (let i = 0; i < filteredPlugins.length; i++) {
    const plugin = filteredPlugins[i];
    const hook = plugin[hookName] as T;
    const preventReason = await callback(hook, plugin);
    // if true, some plugin prevented the operation
    if (preventReason) preventedReasons.push(preventReason);
  }
  if (preventedReasons.length) return { preventedReasons };
}
