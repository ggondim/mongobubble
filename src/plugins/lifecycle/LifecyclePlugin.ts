import { Document, ObjectId } from 'bson';
import { Filter, NumericType, UpdateFilter } from 'mongodb';
import { RepositoryPlugin } from '../../RepositoryPlugin';
import {
  EntityWithLifecycle, LifecycleStages,
} from './EntityWithLifecycle';
import { JsonPatchOperation } from '../../MongoDbUtils';
import {
  IRepositoryPlugin,
  OnAfterDeleteHook,
  OnAfterInsertHook,
  OnAfterPatchHook,
  OnAfterReplaceHook,
} from '../../IRepositoryPlugin';
import IRepository from '../../IRepository';
import { Complex, Primitive } from '../../Utils';

function ensureMetadata(document: Document, options?: Document) {
  EntityWithLifecycle.initializeMetadata(document);

  if (options && options.author) document._meta.events.created.author = options.author;
  if (options && options.comments) document._meta.events.created.comments = options.comments;
  if (options && options.reason) document._meta.events.created.reason = options.reason;
}

function ensureOneOrMany(
  documentOrDocuments: Document | Document[],
  options?: Document,
) {
  if (Array.isArray(documentOrDocuments)) {
    return documentOrDocuments.forEach(document => {
      ensureMetadata(document, options);
    });
  }
  ensureMetadata(documentOrDocuments, options);
}

export type LifecyclePluginOptions = {
  softDelete: true,
};

export default class LifecyclePlugin<TEntity>
  extends RepositoryPlugin<TEntity>
  implements IRepositoryPlugin {
  PLUGIN_NAME = 'LifecyclePlugin' as const;

  softDelete?: boolean;

  constructor(
    repository: IRepository<TEntity>,
    options: Partial<LifecyclePluginOptions> = {},
  ) {
    super(repository, options);
    this.softDelete = options.softDelete || true;
  }

  async onBeforeInsert(
    documentOrDocuments: Document | Document[],
    options?: Document,
  ): Promise<void | Complex> {
    ensureOneOrMany(documentOrDocuments, options);
  }

  async onBeforePatch(
    patch: JsonPatchOperation[] | null,
    mongoUpdate: UpdateFilter<TEntity>,
    options?: Document,
  ): Promise<void | Complex> {
    (() => patch)();
    (() => options)();
    if (!mongoUpdate.$inc) mongoUpdate.$inc = {};
    (mongoUpdate.$inc as Record<string, NumericType>)['_meta.version'] = 1;
  }

  async onBeforeReplace(
    documentOrDocuments: Document | Document[],
    options?: Document,
  ): Promise<void | Complex> {
    ensureOneOrMany(documentOrDocuments, options);
  }

  async onBeforeDelete(
    identity: ObjectId | Primitive | Document,
    options?: Document,
  ): Promise<void | Complex> {
    (() => options)();
    // if soft delete is enabled, then prevent document exclusion and archive it
    if (this.softDelete) {
      const filter = { _id: identity } as Filter<TEntity>;
      const ops = [{
        op: 'replace',
        path: '/_meta/status',
        value: LifecycleStages.ARCHIVED,
      }] as JsonPatchOperation[];
      const result = await this.repository.patchOne(filter, ops);
      return result as Complex;
    }
  }

  onAfterInsert: OnAfterInsertHook;

  onAfterPatch: OnAfterPatchHook;

  onAfterReplace: OnAfterReplaceHook;

  onAFterDelete: OnAfterDeleteHook;
}
