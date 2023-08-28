import { Document } from 'bson';
import { getMethods } from './Utils';
import IRepository from './IRepository';
import { IRepositoryPlugin } from './IRepositoryPlugin';

export class RepositoryPlugin<TEntity> {
  options: Document;

  repository: IRepository<TEntity>;

  constructor(
    repository: IRepository<TEntity>,
    options: Document = {},
  ) {
    this.repository = repository;
    this.options = options;
  }

  implementedHooks(): string[] {
    return getMethods(this).filter(m => m.startsWith('on'));
  }
}

export interface RepositoryPluginConstructor<TOptions = Document> {
  new(
    repository: IRepository<Document>,
    options: TOptions,
  ): IRepositoryPlugin;
}

export interface RepositoryPluginConstructorTyped<TEntity, TOptions = Document> {
  new(
    repository: IRepository<TEntity>,
    options: TOptions,
  ): IRepositoryPlugin;
}
