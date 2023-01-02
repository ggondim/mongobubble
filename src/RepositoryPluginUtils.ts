/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-shadow */

import { Document } from 'bson';
import { IRepositoryPlugin } from './IRepositoryPlugin';
import IRepository from './IRepository';
import { Complex } from './Utils';
import PreventedResult from './PreventedResult';
import LifecyclePlugin from './plugins/lifecycle/LifecyclePlugin';
import JsonSchemaValidationPlugin from './plugins/jsonschema/JsonSchemaValidationPlugin';

export enum DefaultPlugins {
  LifecyclePlugin = 'LifecyclePlugin',
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
      case DefaultPlugins.LifecyclePlugin:
        result.push(new LifecyclePlugin(repository, options));
        break;
      case DefaultPlugins.JsonSchemaValidationPlugin:
        result.push(new JsonSchemaValidationPlugin(repository, options));
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
  callback: (hook: T) => Promise<void | Complex>,
): Promise<void | PreventedResult> {
  const preventedReasons = [];
  const hooks = getPluginHooks<T>(hookName, plugins);
  for (let i = 0; i < hooks.length; i++) {
    const hook = hooks[i];
    const preventReason = await callback(hook);
    // if true, some plugin prevented the operation
    if (preventReason) preventedReasons.push(preventReason);
  }
  if (preventedReasons.length) return { preventedReasons };
}
