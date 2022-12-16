/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable import/no-named-default */
/* eslint-disable max-classes-per-file */
// TODO: JSON Schema mongotype conversion
// TODO: Relationship mapping
// TODO: plugin: timstamps metadata
// TODO: plugin: lifecycle metadata (status)
// TODO: plugin: external id metadata
// TODO: plugin: versioning metadata
// TODO: plugin: schema metadata
// TODO: plugin: source metadata
// TODO: plugin: ancestor metadata

import { Document } from 'bson';
import { Collection, Db, Filter, OptionalUnlessRequiredId, UpdateFilter } from 'mongodb';
import toMongoDbUpdate from 'jsonpatch-to-mongodb';
import { JsonPathOperation } from './JsonPath';
import { IRepositoryPlugin, onAfterInsertHook, onAfterPatchHook, onBeforeInsertHook, onBeforePatchHook, RepositoryPlugin } from './RepositoryPlugin';
import { callPluginHooks, DEFAULT_PLUGINS, getPluginHooks, initializePlugins } from './RepositoryPluginUtils';

type MongoRepositoryOptions = {
  overrideDefaultPlugins?: DEFAULT_PLUGINS[];
  plugins?: IRepositoryPlugin[];
};

export default class MongoRepository<TEntity> {
  collection: Collection<TEntity>;

  db: Db;

  plugins: IRepositoryPlugin[];

  constructor(collectionName: string, db: Db, options?: Document & MongoRepositoryOptions) {
    this.db = db;
    this.collection = db.collection(collectionName);

    const _defPlugins = options.overrideDefaultPlugins || DEFAULT_PLUGINS;

    this.plugins = [
      ...((options.plugins || []) as IRepositoryPlugin[]),
      ...initializePlugins(Object.keys(_defPlugins) as DEFAULT_PLUGINS[]),
    ];
  }

  async insertOne(
    document: OptionalUnlessRequiredId<TEntity>,
  ): Promise<OptionalUnlessRequiredId<TEntity>> {
    await callPluginHooks<onBeforeInsertHook>(
      'onBeforeInsertHook',
      this.plugins,
      async hook => hook(document),
    );

    const result = await this.collection.insertOne(document);

    await callPluginHooks<onAfterInsertHook>(
      'onAfterInsertHook',
      this.plugins,
      async hook => hook(result, document),
    );

    document._id = result.insertedId;
    return document;
  }

  async insertMany(
    documents: OptionalUnlessRequiredId<TEntity>[],
  ): Promise<OptionalUnlessRequiredId<TEntity>[]> {
    await callPluginHooks<onBeforeInsertHook>(
      'onBeforeInsertHook',
      this.plugins,
      async hook => hook(documents),
    );

    const result = await this.collection.insertMany(documents);

    await callPluginHooks<onAfterInsertHook>(
      'onAfterInsertHook',
      this.plugins,
      async hook => hook(result, documents),
    );

    return documents.map((d, i) => {
      d._id = result.insertedIds[i];
      return d;
    });
  }

  async patchOne(filter: Filter<TEntity>, operations: JsonPathOperation[]) {
    const update = toMongoDbUpdate(operations) as UpdateFilter<TEntity>;

    await callPluginHooks<onBeforePatchHook>(
      'onBeforePatchHook',
      this.plugins,
      async hook => hook(operations, update),
    );

    const result = await this.collection.updateOne(filter, update);

    await callPluginHooks<onAfterPatchHook>(
      'onAfterPatchHook',
      this.plugins,
      async hook => hook(result, operations, update),
    );
  }
}
