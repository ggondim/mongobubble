/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-shadow */

import { Document } from 'bson';
import { IRepositoryPlugin } from './IRepositoryPlugin';
import IRepository from './IRepository';
import { Complex } from './Utils';
import PreventedResult from './PreventedResult';
import { RepositoryPluginConstructor, RepositoryPluginConstructorTyped } from './RepositoryPlugin';

export function initializeCustomPlugins<TEntity extends Document>(
  repository: IRepository<TEntity>,
  plugins: RepositoryPluginConstructor[],
  options?: Document,
): void {
  if (!plugins) return;

  plugins
    .map(p => (p as unknown) as RepositoryPluginConstructorTyped<TEntity>) // this is a gambiarra
    .forEach(P => repository.plugins.push(new P(repository, options)));
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
