import { Document } from 'bson';
import { getMethods } from './Utils';
import IRepository from './IRepository';

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
