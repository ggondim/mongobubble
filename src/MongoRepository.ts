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
import { LogLevel, Primitive } from './Utils';
import { DefaultPlugins, callPluginHooks, initializePlugins } from './RepositoryPluginUtils';
import IRepository from './IRepository';
import PreventedResult from './PreventedResult';
import IConnectionManager from './IConnectionManager';
import { ClonableConstructor } from './Entity';
// #endregion

export type MongoRepositoryOptions = {
  overrideDefaultPlugins?: DefaultPlugins[];
  plugins?: IRepositoryPlugin[];
  db: string | Db,
  client?: MongoClient,
  manager?: IConnectionManager,
  logLevel?: LogLevel,
  collectionName?: string,
};

export default class MongoRepository<TEntity> implements IRepository<TEntity> {
  EntityClass: ClonableConstructor<TEntity>;

  collection: Collection<TEntity>;

  db: Db;

  plugins: IRepositoryPlugin[];

  protected readonly collectionName: string;

  protected readonly dbName: string;

  protected readonly client: MongoClient;

  protected readonly manager: IConnectionManager;

  logLevel: LogLevel;

  constructor(
    entityClass: ClonableConstructor<TEntity>,
    options: Document & MongoRepositoryOptions,
  ) {
    const defPlugins = options.overrideDefaultPlugins || DefaultPlugins;

    const staticEntity = entityClass as Document;

    if (!options.collectionName && !staticEntity.COLLECTION) {
      throw new Error('[MongoRepository] You shold specify a class with a static `COLLECTION` '
        + 'property or a `collectionName` option.');
    }

    this.EntityClass = entityClass;
    this.collectionName = options.collectionName || staticEntity.COLLECTION;
    this.client = options.client;
    this.manager = options.manager;
    this.logLevel = options.logLevel || LogLevel.Warn;

    if (typeof options.db !== 'string') {
      this.db = options.db;
    } else {
      this.dbName = options.db;
    }

    this.plugins = [
      ...((options.plugins || []) as IRepositoryPlugin[]),
      ...initializePlugins(
        this,
        Object.keys(defPlugins) as DefaultPlugins[],
        options,
      ),
    ];
  }

  private async ensureDbAndCollection(): Promise<void> {
    if (this.db && this.collection) return;
    if (this.db && !this.collection) {
      this.collection = this.db.collection(this.collectionName);
      return;
    }
    if (!this.client && !this.manager) {
      throw new Error('[MongoRepository] was initialized with `db` option but without `client` or '
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
      'onBeforeInsert',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, documentOrDocuments, options)(),
    );
    if (preventResult) return preventResult;

    const promise = Array.isArray(documentOrDocuments)
      ? this.collection.insertMany(documentOrDocuments)
      : this.collection.insertOne(documentOrDocuments);
    const result = await promise;

    await callPluginHooks<OnAfterInsertHook>(
      'onAfterInsert',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, result, documentOrDocuments)(),
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
      'onBeforePatch',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, jsonPatchOperations, updateFilter)(),
    );
    if (preventResult) return preventResult;

    const result = await this.collection[oneOrMany](filter, updateFilter);

    await callPluginHooks<OnAfterPatchHook>(
      'onAfterPatch',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, result, jsonPatchOperations, updateFilter)(),
    );

    return result;
  }

  async replaceOne(
    document: OptionalUnlessRequiredId<TEntity>,
  ): Promise<UpdateResult | PreventedResult> {
    await this.ensureDbAndCollection();

    const preventResult = await callPluginHooks<OnBeforeReplaceHook>(
      'onBeforeReplace',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, document)(),
    );
    if (preventResult) return preventResult;

    const result = await this.collection.replaceOne({ _id: document._id }, document);

    await callPluginHooks<OnAfterReplaceHook>(
      'onAfterReplace',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, result as UpdateResult, document)(),
    );

    return result as UpdateResult;
  }

  async deleteOne(
    idOrDocument: ObjectId | Primitive | Filter<TEntity>,
  ): Promise<DeleteResult | PreventedResult> {
    await this.ensureDbAndCollection();

    // TODO: the assertion of type object could be a mistake because there are IDs of object type
    const isId = ObjectId.isValid(idOrDocument.toString()) || typeof idOrDocument !== 'object';

    const preventResult = await callPluginHooks<OnBeforeDeleteHook>(
      'onBeforeDelete',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, idOrDocument)(),
    );
    if (preventResult) return preventResult;

    const filter = isId
      ? { _id: idOrDocument } as Filter<TEntity>
      : idOrDocument as Filter<TEntity>;
    const result = await this.collection.deleteOne(filter);

    await callPluginHooks<OnAfterDeleteHook>(
      'onAfterDelete',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, result, idOrDocument)(),
    );

    return result;
  }

  // TODO: separate list and query methods (query not returns a constructed entity but run hooks)
  async list<TResult = TEntity>(
    pipeline = [] as Document[],
    postPipeline = [] as Document[],
  ): Promise<TResult[] | PreventedResult> {
    await this.ensureDbAndCollection();

    const preventResult = await callPluginHooks<OnBeforeListHook>(
      'onBeforeList',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, pipeline)(),
    );
    if (preventResult) return preventResult;

    const finalPipeline = [...pipeline, ...postPipeline];
    const result = await this.collection.aggregate(finalPipeline).toArray();

    await callPluginHooks<OnAfterListHook>(
      'onAfterList',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, finalPipeline, result)(),
    );

    return result as TResult[];
  }

  async get(
    id: InferIdType<TEntity>,
  ): Promise<TEntity | null> {
    await this.ensureDbAndCollection();

    await callPluginHooks<OnBeforeGetHook>(
      'onBeforeGet',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, id)(),
    );

    const result = await this.collection.findOne(({
      _id: id,
    } as unknown) as Filter<TEntity>);

    await callPluginHooks<OnAfterGetHook>(
      'onAfterGet',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, result)(),
    );

    if (!result) return null;
    return new this.EntityClass(result as Partial<TEntity>);
  }
}
