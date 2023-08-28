import { Document, ObjectId } from 'bson';
import {
  Filter,
  MatchKeysAndValues,
  NumericType,
  UpdateFilter,
  UpdateResult,
} from 'mongodb';
import toMongoDbUpdate from 'jsonpatch-to-mongodb';
import {
  Complex,
  IRepository,
  IRepositoryPlugin,
  JsonPatchOperation,
  Primitive,
  RepositoryPlugin,
  equals,
} from '@mongobubble/core';
import {
  EntityWithLifecycle, LifecycleStages, LifecycleTimestamps,
} from './EntityWithLifecycle';

function setMetadata(
  event: LifecycleTimestamps,
  documentOrDocuments: Document | Document[],
  options?: Document,
) {
  if (Array.isArray(documentOrDocuments)) {
    return documentOrDocuments.forEach(document => {
      EntityWithLifecycle.setEvent(event, document, options);
    });
  }
  return EntityWithLifecycle.setEvent(event, documentOrDocuments, options);
}

export type LifecyclePluginOptions = {
  softDelete?: boolean,
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
    this.softDelete = typeof options.softDelete !== 'undefined' ? options.softDelete : true;
  }

  onBeforeList(
    pipeline: Document[],
    postPipeline?: Document[],
  ): void {
    (() => postPipeline)();
    if (pipeline.find(x => x.$match && x.$match['_meta.status'])) return;
    pipeline.push({
      $match: { '_meta.status': LifecycleStages.PUBLISHED },
    });
  }

  async onBeforeInsert(
    documentOrDocuments: Document | Document[],
    options?: Document,
  ): Promise<void | Complex> {
    setMetadata(LifecycleTimestamps.created, documentOrDocuments, options);
  }

  async onBeforePatch(
    patch: JsonPatchOperation[] | null,
    mongoUpdate: UpdateFilter<TEntity>,
    options?: Document,
  ): Promise<void | Complex> {
    (() => patch)();
    (() => options)();

    // version increment
    if (!mongoUpdate.$inc) mongoUpdate.$inc = {};
    (mongoUpdate.$inc as Record<string, NumericType>)['_meta.version'] = 1;

    // updated timestamp event
    if (!mongoUpdate.$set) mongoUpdate.$set = {} as MatchKeysAndValues<TEntity>;
    const ops = EntityWithLifecycle.setEvent(
      LifecycleTimestamps.updated,
      {},
      options,
    );
    const mongoUpdateSet = toMongoDbUpdate(ops) as UpdateFilter<TEntity>;
    mongoUpdate.$set = {
      ...mongoUpdate.$set,
      ...mongoUpdateSet.$set as MatchKeysAndValues<TEntity>,
    };
  }

  async onBeforeReplace(
    documentOrDocuments: Document | Document[],
    options?: Document,
  ): Promise<void | Complex> {
    setMetadata(LifecycleTimestamps.updated, documentOrDocuments, options);

    // get the current version of documents - makes the replace method to have 3 operations
    const documents = Array.isArray(documentOrDocuments)
      ? documentOrDocuments
      : [documentOrDocuments];
    const versions = await this.repository.collection.find({
      _id: {
        $in: documents.map(x => x._id),
      },
    }, {
      projection: { '_meta.version': 1 },
    }).toArray();
    versions.forEach(version => {
      // TODO: this doesn't have a good performance, but it's the only way instead sorting the
      // documents array - maybe convert to a hashmap is better, but every solution iterates
      const document = documents.find(x => equals(x._id, version._id)) as Document;
      EntityWithLifecycle.initializeMetadata(document);
      document._meta.version = (version as Document)._meta.version;
    });
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

  async onAfterReplace(
    result: UpdateResult,
    documentOrDocuments: Document | Document[],
  ): Promise<void> {
    (() => result)();
    // TODO: verify the updated documents before increment version
    const documents = Array.isArray(documentOrDocuments)
      ? documentOrDocuments
      : [documentOrDocuments];
    // calling patchMany already triggers the onBeforePatch hook, that increments version
    await this.repository.patchMany({
      _id: { $in: documents.map(x => x._id) },
    }, {});
    // increments manually the version so the plugin doesn't need to get the documents again
    documents.forEach(d => { d._meta.version += 1; });
  }

  onBeforeGet: undefined;

  onAfterGet: undefined;

  onAfterInsert: undefined;

  onAfterPatch: undefined;

  onAFterDelete: undefined;

  onAfterList: undefined;
}
