// TODO: JSON Schema mongotype conversion
// TODO: EJSON
// TODO: Relationship mapping

// #region [rgba(200,200,200,0.2)] IMPORTS

import { Document, ObjectId } from 'bson';
import {
  Collection,
  Db,
  DeleteResult,
  Filter,
  InferIdType,
  InsertManyResult,
  InsertOneResult,
  MatchKeysAndValues,
  MongoClient,
  OptionalUnlessRequiredId,
  UpdateFilter,
  UpdateResult,
} from 'mongodb';
import toMongoDbUpdate from 'jsonpatch-to-mongodb';
import { JsonPatchOperation } from './MongoDbUtils';
import
{
  IRepositoryPlugin,
  OnAfterDeleteHook,
  OnAfterGetHook,
  OnAfterInsertHook,
  OnAfterListHook,
  OnAfterPatchHook,
  OnAfterReplaceHook,
  OnBeforeDeleteHook,
  OnBeforeGetHook,
  OnBeforeInsertHook,
  OnBeforeListHook,
  OnBeforePatchHook,
  OnBeforeReplaceHook,
}
  from './IRepositoryPlugin';
import { Primitive } from './Utils';
import { DefaultPlugins, callPluginHooks, initializePlugins } from './RepositoryPluginUtils';
import IRepository from './IRepository';
import PreventedResult from './PreventedResult';
import IConnectionManager from './IConnectionManager';
// #endregion

export type MongoRepositoryOptions = {
  overrideDefaultPlugins?: DefaultPlugins[];
  plugins?: IRepositoryPlugin[];
  db: string | Db,
  client?: MongoClient,
  manager?: IConnectionManager,
};

export default class MongoRepository<TEntity> implements IRepository<TEntity> {
  entityConstructor: (obj: Partial<TEntity>) => TEntity;

  collection: Collection<TEntity>;

  db: Db;

  plugins: IRepositoryPlugin[];

  protected readonly collectionName: string;

  protected readonly dbName: string;

  protected readonly client: MongoClient;

  protected readonly manager: IConnectionManager;

  constructor(
    entityConstructor: (obj: Partial<TEntity>) => TEntity,
    collectionName: string,
    options?: Document & MongoRepositoryOptions,
  ) {
    const defPlugins = options.overrideDefaultPlugins || DefaultPlugins;

    this.plugins = [
      ...((options.plugins || []) as IRepositoryPlugin[]),
      ...initializePlugins(this, Object.keys(defPlugins) as DefaultPlugins[]),
    ];

    if (typeof options.db !== 'string') {
      this.db = options.db;
    } else {
      this.dbName = options.db;
    }

    this.entityConstructor = entityConstructor;
    this.collectionName = collectionName;
    this.client = options.client;
    this.manager = options.manager;
  }

  private async ensureDbAndCollection(): Promise<void> {
    if (this.db && this.collection) return;
    if (this.db && !this.collection) {
      this.collection = this.db.collection(this.collectionName);
      return;
    }
    if (!this.client && !this.manager) {
      throw new Error('MongoRepository was initialized with `db` option but without `client` or '
        + '`manager`');
    }
    const client = this.client || await this.manager.getClient();
    this.db = client.db(this.dbName);
    this.collection = this.db.collection(this.collectionName);
  }

  async insertOne(
    document: OptionalUnlessRequiredId<TEntity>,
    options?: Document,
  ): Promise<OptionalUnlessRequiredId<TEntity> | PreventedResult> {
    return this.insert(document, options) as Promise<OptionalUnlessRequiredId<TEntity>>;
  }

  async insertMany(
    documents: OptionalUnlessRequiredId<TEntity>[],
    options?: Document,
  ): Promise<OptionalUnlessRequiredId<TEntity>[] | PreventedResult> {
    return this.insert(documents, options) as Promise<OptionalUnlessRequiredId<TEntity>[]>;
  }

  private async insert(
    documentOrDocuments: OptionalUnlessRequiredId<TEntity> | OptionalUnlessRequiredId<TEntity>[],
    options?: Document,
  ): Promise<
    OptionalUnlessRequiredId<TEntity>
    | OptionalUnlessRequiredId<TEntity>[]
    | PreventedResult
    > {
    await this.ensureDbAndCollection();

    const preventResult = await callPluginHooks<OnBeforeInsertHook>(
      'onBeforeInsertHook',
      this.plugins,
      async hook => hook(documentOrDocuments, options),
    );
    if (preventResult) return preventResult;

    const promise = Array.isArray(documentOrDocuments)
      ? this.collection.insertMany(documentOrDocuments)
      : this.collection.insertOne(documentOrDocuments);
    const result = await promise;

    await callPluginHooks<OnAfterInsertHook>(
      'onAfterInsertHook',
      this.plugins,
      async hook => hook(result, documentOrDocuments),
    );

    if (Array.isArray(documentOrDocuments)) {
      return documentOrDocuments.map((d, i) => {
        d._id = (result as InsertManyResult).insertedIds[i];
        return d;
      });
    }
    documentOrDocuments._id = (result as InsertOneResult).insertedId;
    return documentOrDocuments;
  }

  async patchOne(
    filter: Filter<TEntity>,
    documentSetProperties: Partial<TEntity>,
  ): Promise<Document | PreventedResult>;
  async patchOne(
    filter: Filter<TEntity>,
    jsonPatchOperations: JsonPatchOperation[],
  ): Promise<Document | PreventedResult>;
  async patchOne(
    filter: Filter<TEntity>,
    operationsOrDocumentPatch: JsonPatchOperation[] | Partial<TEntity>,
  ): Promise<Document | PreventedResult> {
    return this.patch(filter, operationsOrDocumentPatch, 'updateOne');
  }

  async patchMany(
    filter: Filter<TEntity>,
    documentSetProperties: Partial<TEntity>,
  ): Promise<UpdateResult | PreventedResult>;
  async patchMany(
    filter: Filter<TEntity>,
    jsonPatchOperations: JsonPatchOperation[],
  ): Promise<UpdateResult | PreventedResult>;
  async patchMany(
    filter: Filter<TEntity>,
    operationsOrDocumentPatch: JsonPatchOperation[] | Partial<TEntity>,
  ): Promise<UpdateResult | PreventedResult> {
    return this.patch(filter, operationsOrDocumentPatch, 'updateMany') as Promise<UpdateResult>;
  }

  private async patch(
    filter: Filter<TEntity>,
    operationsOrDocumentPatch: JsonPatchOperation[] | Partial<TEntity>,
    oneOrMany: 'updateOne' | 'updateMany',
  ): Promise<Document | UpdateResult | PreventedResult> {
    await this.ensureDbAndCollection();

    const isJsonPatch = Array.isArray(operationsOrDocumentPatch);
    const jsonPatchOperations = isJsonPatch ? operationsOrDocumentPatch : null;
    const updateFilter = isJsonPatch
      ? toMongoDbUpdate(operationsOrDocumentPatch) as UpdateFilter<TEntity>
      : { $set: operationsOrDocumentPatch as MatchKeysAndValues<TEntity> };

    const preventResult = await callPluginHooks<OnBeforePatchHook<TEntity>>(
      'onBeforePatchHook',
      this.plugins,
      async hook => hook(jsonPatchOperations, updateFilter),
    );
    if (preventResult) return preventResult;

    const result = await this.collection[oneOrMany](filter, updateFilter);

    await callPluginHooks<OnAfterPatchHook>(
      'onAfterPatchHook',
      this.plugins,
      async hook => hook(result, jsonPatchOperations, updateFilter),
    );

    return result;
  }

  async replaceOne(
    document: OptionalUnlessRequiredId<TEntity>,
  ): Promise<UpdateResult | PreventedResult> {
    await this.ensureDbAndCollection();

    const preventResult = await callPluginHooks<OnBeforeReplaceHook>(
      'onBeforeReplaceHook',
      this.plugins,
      async hook => hook(document),
    );
    if (preventResult) return preventResult;

    const result = await this.collection.replaceOne({ _id: document._id }, document);

    await callPluginHooks<OnAfterReplaceHook>(
      'onAfterReplaceHook',
      this.plugins,
      async hook => hook(result as UpdateResult, document),
    );

    return result as UpdateResult;
  }

  async deleteOne(
    idOrDocument: ObjectId | Primitive | Filter<TEntity>,
  ): Promise<DeleteResult | PreventedResult> {
    await this.ensureDbAndCollection();

    const isId = ObjectId.isValid(idOrDocument.toString()) || typeof idOrDocument !== 'object';

    const preventResult = await callPluginHooks<OnBeforeDeleteHook>(
      'onBeforeDeleteHook',
      this.plugins,
      async hook => hook(idOrDocument),
    );
    if (preventResult) return preventResult;

    const filter = isId
      ? { _id: idOrDocument } as Filter<TEntity>
      : idOrDocument as Filter<TEntity>;
    const result = await this.collection.deleteOne(filter);

    await callPluginHooks<OnAfterDeleteHook>(
      'onAfterDeleteHook',
      this.plugins,
      async hook => hook(result, idOrDocument),
    );

    return result;
  }

  // TODO: separate list and query methods (query not returns a constructed entity)
  async list<TResult = TEntity>(
    pipeline = [] as Document[],
    postPipeline = [] as Document[],
  ): Promise<TResult[] | PreventedResult> {
    await this.ensureDbAndCollection();

    const preventResult = await callPluginHooks<OnBeforeListHook>(
      'onBeforeListHook',
      this.plugins,
      async hook => hook(pipeline),
    );
    if (preventResult) return preventResult;

    const finalPipeline = [...pipeline, ...postPipeline];
    const result = await this.collection.aggregate(finalPipeline).toArray();

    await callPluginHooks<OnAfterListHook>(
      'onAfterListHook',
      this.plugins,
      async hook => hook(finalPipeline, result),
    );

    return result as TResult[];
  }

  async get(
    id: InferIdType<TEntity>,
  ): Promise<TEntity | PreventedResult> {
    await this.ensureDbAndCollection();

    const preventResult = await callPluginHooks<OnBeforeGetHook>(
      'onBeforeGetHook',
      this.plugins,
      async hook => hook(id),
    );
    if (preventResult) return preventResult;

    const result = await this.collection.findOne(({
      _id: id,
    } as unknown) as Filter<TEntity>);

    await callPluginHooks<OnAfterGetHook>(
      'onAfterGetHook',
      this.plugins,
      async hook => hook(result),
    );

    return this.entityConstructor(result as Partial<TEntity>);
  }
}
