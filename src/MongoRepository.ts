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

/**
 * MongoRepository initialization options
 * @type
 */
export type MongoRepositoryOptions = {
  /**
   * (Optional) Controls what default plugins should be initialized. None should be `[]`. Default
   * plugins are specified in `DefaultPlugins` enum.
   */
  overrideDefaultPlugins?: DefaultPlugins[];
  /**
   * (Optional) Custom plugins that repository will use. Each plugin should implement
   * {IRepositoryPlugin} interface.
   */
  plugins?: IRepositoryPlugin[];
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
   *  specified, it will try to infer from an static property `COLLECTION` declared in `EntityClass`
   */
  collectionName?: string,
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

  protected readonly client: MongoClient;

  protected readonly manager: IConnectionManager;

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

  // TODO: implement driver options
  /**
   * Inserts one object into the collection.
   * @param {OptionalUnlessRequiredId<TEntity>} document The object to insert.
   * @param {Document} [options] Plugin and driver options.
   * @return {(Promise<OptionalUnlessRequiredId<TEntity> | PreventedResult>)} Returns the entity
   *  filled with a new identity `_id` or a {PreventedResult} if it was prevented by some plugin.
   * @memberof MongoRepository
   */
  async insertOne(
    document: OptionalUnlessRequiredId<TEntity>,
    options?: Document,
  ): Promise<OptionalUnlessRequiredId<TEntity> | PreventedResult> {
    return this
      .insert(document, options) as Promise<OptionalUnlessRequiredId<TEntity> | PreventedResult>;
  }

  // TODO: fill insertedIds to array result
  /**
   * Inserts many objects into the collection.
   * @param {OptionalUnlessRequiredId<TEntity>[]} documents The objects to insert.
   * @param {Document} [options] Plugin and driver options.
   * @return {(Promise<OptionalUnlessRequiredId<TEntity>[] | PreventedResult>)} Returns the entities
   *  or a {PreventedResult} if it was prevented by some plugin.
   * @memberof MongoRepository
   */
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

  // TODO: assure the result Document is the patched one
  /**
   * Updates one document using a patch object.
   * @param {Filter<TEntity>} filter The update filter to query the database.
   * @param {Partial<TEntity>} documentSetProperties The properties that should be patched ($set).
   * @return {(Promise<Document | PreventedResult>)} The patched document or a {PreventedResult}
   *  if it was prevented by some plugin.
   * @memberof MongoRepository
   */
  async patchOne(
    filter: Filter<TEntity>,
    documentSetProperties: Partial<TEntity>,
  ): Promise<Document | PreventedResult>;
  /**
   * Updates one document using a patch object.
   * @param {Filter<TEntity>} filter The update filter to query the database.
   * @param {JsonPatchOperation[]} jsonPatchOperations A list of JSON Patch operations to perform
   *  in the object in database. These operations will be converted to a MongoDB update operations
   *  object.
   * @return {(Promise<Document | PreventedResult>)} The patched document or a {PreventedResult}
   *  if it was prevented by some plugin.
   * @memberof MongoRepository
   */
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

  // TODO: return the patched documents, not the UpdateResult
  /**
   * Updates multiple documents using a patch object.
   * @param {Filter<TEntity>} filter The update filter to query the database.
   * @param {Partial<TEntity>} documentSetProperties The properties that should be patched ($set).
   * @return {(Promise<UpdateResult | PreventedResult>)} An {UpdateResult} or a {PreventedResult}
   *  if it was prevented by some plugin.
   * @memberof MongoRepository
   */
  async patchMany(
    filter: Filter<TEntity>,
    documentSetProperties: Partial<TEntity>,
  ): Promise<UpdateResult | PreventedResult>;
  /**
   * Updates multiple documents using a patch object.
   * @param {Filter<TEntity>} filter The update filter to query the database.
   * @param {JsonPatchOperation[]} jsonPatchOperations A list of JSON Patch operations to perform
   *  in the objects in database. These operations will be converted to a MongoDB update operations
   *  object.
   * @return {(Promise<UpdateResult | PreventedResult>)} An {UpdateResult} or a {PreventedResult}
   *  if it was prevented by some plugin.
   * @memberof MongoRepository
   */
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

  // TODO: assure the result Document is the replaced one with the new metadata
  /**
   * Replaces an entire document in database, keeping its metadata (if LifecyclePlugin is enabled).
   *  Mind if the LifecyclePlugin is enabled, it will perform three operations: 1. Retrieve the
   *  document version; 2. Replace the document; 3. Increment the old version.
   * @param {OptionalUnlessRequiredId<TEntity>} document The object with an identity to replace.
   * @return {(Promise<UpdateResult | PreventedResult>)} An {UpdateResult} or a {PreventedResult}
   *  if it was prevented by some plugin.
   * @memberof MongoRepository
   */
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

  /**
   * Deletes a single document by its identity.
   * @param {(ObjectId | Primitive | Filter<TEntity>)} idOrDocument The object identity.
   * @return {(Promise<DeleteResult | PreventedResult>)} A {DeleteResult} or a {PreventedResult}
   *  if it was prevented by some plugin.
   * @memberof MongoRepository
   */
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
  /**
   * List documents of collection using the MongoDB's Aggregation, given an aggregation pipeline.
   *  If LifecyclePlugin is enabled, it will filter only the published documents.
   * @template TResult The result type if is not the entity's type itself. Useful when you build a
   *  pipeline that doesn't return an entity-formed object (ie: only aggregations or summaries).
   * @param [pipeline=[] as Document[]]} The initial pipeline agreggation to execute.
   * @param [postPipeline=[] as Document[]] An additional pipeline aggregation to execute after
   *  plugins injected other pipelines.
   * @return {(Promise<TResult[] | PreventedResult>)} The documents returned by the aggregation or
   *  a {PreventedResult} if it was prevented by some plugin.
   * @memberof MongoRepository
   */
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

    if (!result) return null;
    return new this.EntityClass(result as Partial<TEntity>);
  }
}
