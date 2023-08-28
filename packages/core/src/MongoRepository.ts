// #region [rgba(200,200,200,0.2)] IMPORTS

import { Document, ObjectId } from 'bson';
import {
  BulkWriteOptions,
  Collection,
  Db,
  DeleteResult,
  Filter,
  InferIdType,
  InsertOneOptions,
  MatchKeysAndValues,
  MongoClient,
  OptionalUnlessRequiredId,
  UpdateFilter,
  UpdateOptions,
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
import { Complex, LogLevel } from './Utils';
import {
  callPluginHooks,
  initializeCustomPlugins,
} from './RepositoryPluginUtils';
import IRepository from './IRepository';
import PreventedResult, { PreventedResultError } from './PreventedResult';
import IConnectionManager from './IConnectionManager';
import { ClonableConstructor } from './Entity';
import { RepositoryPluginConstructor } from './RepositoryPlugin';
// #endregion

/**
 * MongoRepository initialization options
 * @type
 */
export type MongoRepositoryOptions = {
  /**
   * (Optional) Custom plugins that repository classes  will use. Each plugin should implement
   * {IRepositoryPlugin} interface.
   */
  plugins?: RepositoryPluginConstructor[];
  /**
   * The name of database or a Mongo {Db} instance.
   */
  db: string | Db,
  /**
   * (Optional) If db is not an instance of {Db}, the repository need a {MongoClient} to perform
   *  operations. Additionally, you can specify a connection manager instead, with the option
   *  `manager`.
   */
  client?: MongoClient,
  /**
   * (Optional) If db is not an instance of {Db}, the repository need an {IConnectionManager}
   *  to perform operations. Additionally, you can specify a MongoClient instead, with the
   *  option `manager`.
   */
  manager?: IConnectionManager,
  /**
   * (Optional) Default: 'Warn'. The log level that will be used. Affects `console.[log|warn|error]`
   *   used inside the repository and plugins.
   */
  logLevel?: LogLevel,
  /**
   * (Optional) The collection name that will be used to perform repository operations. If not
   *  specified, it will try to infer from a static property `COLLECTION` declared in `EntityClass`
   */
  collectionName?: string,

  /**
   * (Optional) The connection string to be used to connect to the database.
   */
  uri?: string,

  /**
   * (Optional) If true, the repository will open and close connections automatically during each
   * operation.
   */
  autoConnectionSwitch?: boolean,
};

/**
 * An implementation of {IRepository} for MongoDB.
 * @export
 * @class MongoRepository
 * @implements {IRepository<TEntity>}
 * @template TEntity
 */
export default class MongoRepository<TEntity> implements IRepository<TEntity> {
  readonly EntityClass: ClonableConstructor<TEntity>;

  /**
   * The MongoDB driver's {Collection} instance. You can use it for custom operations that will not
   *  be intercepted by the repository.
   * @type {Collection<TEntity>}
   * @memberof MongoRepository
   */
  collection: Collection<TEntity>;

  /**
   * The MongoDB driver's {Db} instance. You can use it for custom operations that will not be
   *  intercepted by the repository.
   * @type {Db}
   * @memberof MongoRepository
   */
  db: Db;

  /**
   * The plugins that were initialized during repository's construction.
   * @type {IRepositoryPlugin[]}
   * @memberof MongoRepository
   */
  logLevel: LogLevel;

  /**
   * The plugins that were initialized during repository's construction.
   * @type {IRepositoryPlugin[]}
   * @memberof MongoRepository
   */
  plugins: IRepositoryPlugin[];

  protected readonly collectionName: string;

  protected readonly dbName: string;

  protected client: MongoClient;

  protected readonly manager: IConnectionManager;

  protected readonly uri: string;

  protected readonly autoConnectionSwitch: boolean;

  /**
   * Creates an instance of MongoRepository.
   * @param {ClonableConstructor<TEntity>} entityClass The entity class constructor of {TEntity}.
   *  This is necessary for instantiating TEntity after read operations like 'get' and 'list'.
   * @param {(Document & MongoRepositoryOptions)} options Options for the repository initialization
   *  and any other options for its plugins.
   * @memberof MongoRepository
   */
  constructor(
    entityClass: ClonableConstructor<TEntity>,
    options: Document & MongoRepositoryOptions,
  ) {
    const staticEntity = entityClass as Document;

    if (!options.collectionName && !staticEntity.COLLECTION) {
      throw new Error('[MongoRepository] You shold specify a class with a static `COLLECTION` '
        + 'property or a `collectionName` option.');
    }

    this.EntityClass = entityClass;
    this.collectionName = options.collectionName || staticEntity.COLLECTION;
    this.client = options.client;
    this.manager = options.manager;
    this.uri = options.uri;
    this.autoConnectionSwitch = options.autoConnectionSwitch || false;
    this.logLevel = options.logLevel || LogLevel.Warn;

    if (typeof options.db !== 'string') {
      this.db = options.db;
    } else {
      this.dbName = options.db;
    }

    this.plugins = [] as IRepositoryPlugin[];
    initializeCustomPlugins(this, options.plugins, options);
  }

  protected async ensureDbAndCollection(): Promise<void> {
    // Everything is already initialized
    if (this.db && this.collection) return;

    // Only collection is missing, but it can be get from db
    if (this.db && !this.collection) {
      this.collection = this.db.collection(this.collectionName);
      return;
    }

    // Both db and collection are missing. Need to initialize them.

    if (!this.client && !this.manager && !this.uri) {
      throw new Error('[MongoRepository] missing sufficient connection options.`');
    }

    let client: MongoClient = this.client;
    if (!client && this.manager) {
      client = await this.manager.getClient();
    } else if (!client && this.uri) {
      client = await MongoClient.connect(this.uri);
    }

    this.client = client;
    this.db = client.db(this.dbName);
    this.collection = this.db.collection(this.collectionName);
  }

  protected autoClose(): void {
    if (this.uri && this.autoConnectionSwitch) {
      this.client.close();
      this.db = null;
      this.collection = null;
    }
  }

  dispose(): void {
    // TODO: implement disposable plugins
    // this.plugins.forEach((plugin) => {
    //   if (plugin.dispose) plugin.dispose();
    // });
    if (this.client) this.client.close();
  }

  /**
   * Inserts one object into the collection.
   * @param {OptionalUnlessRequiredId<TEntity>} document The object to insert.
   * @param {Document & Partial<InsertOneOptions>} [options] Plugin and driver options.
   * @return {(Promise<OptionalUnlessRequiredId<TEntity>>)} Returns the entity filled with a new
   *  identity `_id`.
   * @throws {PreventedResultError} If the operation was prevented by some plugin.
   * @memberof MongoRepository
   */
  async insertOne(
    document: OptionalUnlessRequiredId<TEntity>,
    options?: Document & Partial<InsertOneOptions>,
  ): Promise<OptionalUnlessRequiredId<TEntity>> {
    return this
      .insert(document, options) as Promise<OptionalUnlessRequiredId<TEntity>>;
  }

  /**
   * Inserts many objects into the collection.
   * @param {OptionalUnlessRequiredId<TEntity>[]} documents The objects to insert.
   * @param {Document & Partial<BulkWriteOptions>} [options] Plugin and driver options.
   * @return {(Promise<OptionalUnlessRequiredId<TEntity>[]>)} Returns the initial documents with
   *  their new identities.
   * @throws {PreventedResultError} If the operation was prevented by some plugin.
   * @memberof MongoRepository
   */
  async insertMany(
    documents: OptionalUnlessRequiredId<TEntity>[],
    options?: Document & Partial<BulkWriteOptions>,
  ): Promise<OptionalUnlessRequiredId<TEntity>[]> {
    return this.insert(documents, options) as Promise<OptionalUnlessRequiredId<TEntity>[]>;
  }

  private async insert(
    documentOrDocuments: OptionalUnlessRequiredId<TEntity> | OptionalUnlessRequiredId<TEntity>[],
    options?: Document & Partial<BulkWriteOptions | InsertOneOptions>,
  ): Promise<OptionalUnlessRequiredId<TEntity> | OptionalUnlessRequiredId<TEntity>[]> {
    await this.ensureDbAndCollection();

    const preventResult = await callPluginHooks<OnBeforeInsertHook>(
      'onBeforeInsert',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, documentOrDocuments, options)(),
    );
    if (preventResult) throw new PreventedResultError(preventResult);

    const promise = Array.isArray(documentOrDocuments)
      ? this.collection.insertMany(documentOrDocuments, options)
      : this.collection.insertOne(documentOrDocuments, options);
    const result = await promise;

    await callPluginHooks<OnAfterInsertHook>(
      'onAfterInsert',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, result, documentOrDocuments)(),
    );

    this.autoClose();

    return documentOrDocuments;
  }

  /**
   * Updates a document given its identity using a patch $set object.
   * @param {InferIdType<TEntity>} id The document identity.
   * @param {Partial<TEntity>} documentSetProperties The properties that should be patched ($set).
   * @param {(Document & UpdateOptions)} [options] Plugin and driver options.
   * @throws {PreventedResultError} If the operation was prevented by some plugin.
   * @return {(Promise<UpdateResult>)} An {UpdateResult}
   * @memberof MongoRepository
   */
  async patchOneById(
    id: InferIdType<TEntity>,
    documentSetProperties: Partial<TEntity>,
    options?: Document & UpdateOptions,
  ): Promise<Document | PreventedResult>;
  /**
   * Updates a document given its identity using a JSON Patch array.
   * @param {InferIdType<TEntity>} id The document identity.
   * @param {JsonPatchOperation[]} jsonPatchOperations A list of JSON Patch operations to perform
   *  in the object in database. These operations will be converted to a MongoDB update operations
   *  object.
   * @param {(Document & UpdateOptions)} [options] Plugin and driver options.
   * @throws {PreventedResultError} If the operation was prevented by some plugin.
   * @return {(Promise<UpdateResult>)} An {UpdateResult}
   * @memberof MongoRepository
   */
  async patchOneById(
    id: InferIdType<TEntity>,
    jsonPatchOperations: JsonPatchOperation[],
    options?: Document & UpdateOptions,
  ): Promise<Document | PreventedResult>;
  async patchOneById(
    id: InferIdType<TEntity>,
    operationsOrDocumentPatch: JsonPatchOperation[] | Partial<TEntity>,
    options?: Document & UpdateOptions,
  ): Promise<Document | PreventedResult> {
    return this.patch(
      { _id: id } as unknown as Filter<TEntity>,
      operationsOrDocumentPatch,
      'updateOne',
      options,
    ) as Promise<Document | PreventedResult>;
  }

  /**
   * Updates one document using a patch object.
   * @param {Filter<TEntity>} filter The update filter to query the database.
   * @param {Partial<TEntity>} documentSetProperties The properties that should be patched ($set).
   * @return {(Promise<UpdateResult>)} An {UpdateResult}
   * @throws {PreventedResultError} If the operation was prevented by some plugin.
   * @memberof MongoRepository
   */
  async patchOne(
    filter: Filter<TEntity>,
    documentSetProperties: Partial<TEntity>,
    options?: Document & UpdateOptions,
  ): Promise<UpdateResult>;
  /**
   * Updates one document using a patch object.
   * @param {Filter<TEntity>} filter The update filter to query the database.
   * @param {JsonPatchOperation[]} jsonPatchOperations A list of JSON Patch operations to perform
   *  in the object in database. These operations will be converted to a MongoDB update operations
   *  object.
   * @return {(Promise<UpdateResult>)} An {UpdateResult}
   * @throws {PreventedResultError} If the operation was prevented by some plugin.
   * @memberof MongoRepository
   */
  async patchOne(
    filter: Filter<TEntity>,
    jsonPatchOperations: JsonPatchOperation[],
    options?: Document & UpdateOptions,
  ): Promise<Document>;
  async patchOne(
    filter: Filter<TEntity>,
    operationsOrDocumentPatch: JsonPatchOperation[] | Partial<TEntity>,
    options?: Document & UpdateOptions,
  ): Promise<Document> {
    return this.patch(filter, operationsOrDocumentPatch, 'updateOne', options);
  }

  /**
   * Updates multiple documents using a patch object.
   * @param {Filter<TEntity>} filter The update filter to query the database.
   * @param {Partial<TEntity>} documentSetProperties The properties that should be patched ($set).
   * @return {(Promise<UpdateResult>)} An {UpdateResult}
   * @throws {PreventedResultError} If the operation was prevented by some plugin.
   * @memberof MongoRepository
   */
  async patchMany(
    filter: Filter<TEntity>,
    documentSetProperties: Partial<TEntity>,
    options?: Document & UpdateOptions,
  ): Promise<UpdateResult>;
  /**
   * Updates multiple documents using a patch object.
   * @param {Filter<TEntity>} filter The update filter to query the database.
   * @param {JsonPatchOperation[]} jsonPatchOperations A list of JSON Patch operations to perform
   *  in the objects in database. These operations will be converted to a MongoDB update operations
   *  object.
   * @return {(Promise<UpdateResult>)} An {UpdateResult}
   * @throws {PreventedResultError} If the operation was prevented by some plugin.
   * @memberof MongoRepository
   */
  async patchMany(
    filter: Filter<TEntity>,
    jsonPatchOperations: JsonPatchOperation[],
    options?: Document & UpdateOptions,
  ): Promise<UpdateResult>;
  async patchMany(
    filter: Filter<TEntity>,
    operationsOrDocumentPatch: JsonPatchOperation[] | Partial<TEntity>,
    options?: Document & UpdateOptions,
  ): Promise<UpdateResult> {
    return this.patch(
      filter,
      operationsOrDocumentPatch,
      'updateMany',
      options,
    ) as Promise<UpdateResult>;
  }

  private async patch(
    filter: Filter<TEntity>,
    operationsOrDocumentPatch: JsonPatchOperation[] | Partial<TEntity>,
    oneOrMany: 'updateOne' | 'updateMany',
    options?: Document & UpdateOptions,
  ): Promise<Document | UpdateResult> {
    await this.ensureDbAndCollection();

    const isJsonPatch = Array.isArray(operationsOrDocumentPatch);
    const jsonPatchOperations = isJsonPatch ? operationsOrDocumentPatch : null;
    const updateFilter = isJsonPatch
      ? toMongoDbUpdate(operationsOrDocumentPatch) as UpdateFilter<TEntity>
      : { $set: operationsOrDocumentPatch as MatchKeysAndValues<TEntity> };

    const preventResult = await callPluginHooks<OnBeforePatchHook<TEntity>>(
      'onBeforePatch',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, jsonPatchOperations, updateFilter, options)(),
    );
    if (preventResult) throw new PreventedResultError(preventResult);

    const result = await this.collection[oneOrMany](filter, updateFilter, options);

    await callPluginHooks<OnAfterPatchHook>(
      'onAfterPatch',
      this.plugins,
      async (hook, plugin) => hook.bind(
        plugin,
        result,
        jsonPatchOperations,
        updateFilter,
        options,
      )(),
    );

    this.autoClose();

    return result;
  }

  // TODO: ensure the result Document is the replaced one with the new metadata
  /**
   * Replaces an entire document in database, keeping its metadata (if LifecyclePlugin is enabled).
   *  Mind if the LifecyclePlugin is enabled, it will perform three operations: 1. Retrieve the
   *  document version; 2. Replace the document; 3. Increment the old version.
   * @param {OptionalUnlessRequiredId<TEntity>} document The object with an identity to replace.
   * @return {(Promise<UpdateResult>)} An {UpdateResult}
   * @throws {PreventedResultError} If the operation was prevented by some plugin.
   * @memberof MongoRepository
   */
  async replaceOne(
    document: OptionalUnlessRequiredId<TEntity>,
  ): Promise<UpdateResult> {
    await this.ensureDbAndCollection();

    const preventResult = await callPluginHooks<OnBeforeReplaceHook>(
      'onBeforeReplace',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, document)(),
    );
    if (preventResult) throw new PreventedResultError(preventResult);

    const result = await this.collection.replaceOne({ _id: document._id }, document);

    await callPluginHooks<OnAfterReplaceHook>(
      'onAfterReplace',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, result as UpdateResult, document)(),
    );

    this.autoClose();

    return result as UpdateResult;
  }

  /**
   * Deletes a single document by its identity.
   * @param {(Complex | ObjectId)} idOrDocument The object identity.
   * @return {(Promise<DeleteResult>)} A {DeleteResult}
   * @throws {PreventedResultError} If the operation was prevented by some plugin.
   * @memberof MongoRepository
   */
  async deleteOneById(
    idOrDocument: Complex | ObjectId,
  ): Promise<DeleteResult> {
    return this.deleteOne({ _id: idOrDocument } as Filter<TEntity>);
  }

  /**
   * Deletes a single document by its identity.
   * @param {(ObjectId | Primitive | Filter<TEntity>)} idOrDocument The object identity.
   * @return {(Promise<DeleteResult>)} A {DeleteResult}
   * @throws {PreventedResultError} If the operation was prevented by some plugin.
   * @memberof MongoRepository
   */
  async deleteOne(
    query: Filter<TEntity>,
  ): Promise<DeleteResult> {
    await this.ensureDbAndCollection();

    const preventResult = await callPluginHooks<OnBeforeDeleteHook>(
      'onBeforeDelete',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, query)(),
    );
    if (preventResult) throw new PreventedResultError(preventResult);

    const result = await this.collection.deleteOne(query);

    await callPluginHooks<OnAfterDeleteHook>(
      'onAfterDelete',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, result, query)(),
    );

    this.autoClose();

    return result;
  }

  /**
   * List documents of collection using the MongoDB's Aggregation, given an aggregation pipeline.
   *  If LifecyclePlugin is enabled, it will filter only the published documents.
   * @param [pipeline=[] as Document[]]} The initial pipeline agreggation to execute.
   * @param [postPipeline=[] as Document[]] An additional pipeline aggregation to execute after
   *  plugins injected other pipelines.
   * @return {(Promise<TEntity[]>)} The documents returned by the aggregation.
   * @throws {PreventedResultError} If the operation was prevented by some plugin.
   * @memberof MongoRepository
   */
  async list(
    pipeline = [] as Document[],
    postPipeline = [] as Document[],
  ): Promise<TEntity[]> {
    await this.ensureDbAndCollection();

    const preventResult = await callPluginHooks<OnBeforeListHook>(
      'onBeforeList',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, pipeline)(),
    );
    if (preventResult) throw new PreventedResultError(preventResult);

    const finalPipeline = [...pipeline, ...postPipeline];
    const result = await this.collection.aggregate(finalPipeline).toArray();

    await callPluginHooks<OnAfterListHook>(
      'onAfterList',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, finalPipeline, result)(),
    );

    this.autoClose();

    return result.map(d => new this.EntityClass(d as Partial<TEntity>));
  }

  /**
   * Query documents of collection using the MongoDB's Aggregation, given an aggregation pipeline.
   *  If LifecyclePlugin is enabled, it will filter only the published documents.
   * @template TResult The result type if is not the entity's type itself. Useful when you build a
   *  pipeline that doesn't return an entity-formed object (ie: only aggregations or summaries).
   * @param [pipeline=[] as Document[]]} The initial pipeline agreggation to execute.
   * @param [postPipeline=[] as Document[]] An additional pipeline aggregation to execute after
   *  plugins injected other pipelines.
   * @return {(Promise<TResult[]>)} The documents returned by the aggregation
   * @throws {PreventedResultError} If the operation was prevented by some plugin.
   * @memberof MongoRepository
   */
  async query<TResult>(
    pipeline = [] as Document[],
    postPipeline = [] as Document[],
  ): Promise<TResult[]> {
    await this.ensureDbAndCollection();

    const preventResult = await callPluginHooks<OnBeforeListHook>(
      'onBeforeList',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, pipeline)(),
    );
    if (preventResult) throw new PreventedResultError(preventResult);

    const finalPipeline = [...pipeline, ...postPipeline];
    const result = await this.collection.aggregate(finalPipeline).toArray();

    await callPluginHooks<OnAfterListHook>(
      'onAfterList',
      this.plugins,
      async (hook, plugin) => hook.bind(plugin, finalPipeline, result)(),
    );

    this.autoClose();

    return result as TResult[];
  }

  /**
   * Gets a single document by its identity.
   * @param {InferIdType<TEntity>} id The document identity.
   * @return {(Promise<TEntity | null>)} The found document instantiated by the {EntityConstructor}
   *  or null if it was not found.
   * @memberof MongoRepository
   */
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

    this.autoClose();

    if (!result) return null;
    return new this.EntityClass(result as Partial<TEntity>);
  }
}
