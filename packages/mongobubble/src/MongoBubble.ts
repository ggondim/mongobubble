import { Document, ObjectId } from 'bson';
import { Collection, InferIdType, OptionalUnlessRequiredId } from 'mongodb';
import {
  MongoRepository,
  MongoRepositoryOptions,
  OnAfterListHook,
  OnBeforeListHook,
  PreventedResult,
  callPluginHooks,
} from '@mongobubble/core';
import { OnlineArchiveConnectionType } from '@mongobubble/online-archive';
import { TsEdValidator } from '@mongobubble/validator-tsed';
import { EntityWithLifecycle, LifecycleStages } from './EntityWithLifecycle';
import LifecyclePlugin, { LifecyclePluginOptions } from './LifecyclePlugin';

export default class MongoBubble<
  TEntity extends EntityWithLifecycle<TEntity, Identity>,
  Identity = ObjectId> extends MongoRepository<TEntity> {
  /**
   * Creates an instance of MongoBubble.
   * @param {ClonableConstructor<TEntity>} entityClass The entity class constructor of {TEntity}.
   *  This is necessary for instantiating TEntity after read operations like 'get' and 'list'.
   * @param {(Document & MongoRepositoryOptions & LifecyclePluginOptions)} options Options for the
   *  repository initialization and any other options for its plugins.
   * @memberof MongoRepository
   */
  constructor(
    options: Document & MongoRepositoryOptions<TEntity> & LifecyclePluginOptions,
  ) {
    super(options);
    this.plugins.push(new LifecyclePlugin(this, options as Partial<LifecyclePluginOptions>));
    this.validator = TsEdValidator;
  }

  /**
   * List documents of collection using the MongoDB's Aggregation, given an aggregation pipeline.
   *  Results are filtered only by the draft documents.
   * @param [pipeline=[] as Document[]]} The initial pipeline agreggation to execute.
   * @param [postPipeline=[] as Document[]] An additional pipeline aggregation to execute after
   *  plugins injected other pipelines.
   * @return {(Promise<TResult[] | PreventedResult>)} The documents returned by the aggregation or
   *  a {PreventedResult} if it was prevented by some plugin.
   * @memberof MongoRepository
   */
  async listDrafts(
    pipeline = [] as Document[],
    postPipeline = [] as Document[],
  ): Promise<TEntity[] | PreventedResult> {
    await this.ensureDbAndCollection();
    return this.list([
      ...pipeline,
      {
        $match: { '_meta.status': LifecycleStages.DRAFT },
      },
      ...postPipeline,
    ]);
  }

  /**
   * List documents of collection using the MongoDB's Aggregation, given an aggregation pipeline.
   *  Results are filtered only by the archived documents. If a connection manager was set to the
   *  repository, it will try to use the Federated connection.
   * @param [pipeline=[] as Document[]]} The initial pipeline agreggation to execute.
   * @param [postPipeline=[] as Document[]] An additional pipeline aggregation to execute after
   *  plugins injected other pipelines.
   * @return {(Promise<TResult[] | PreventedResult>)} The documents returned by the aggregation or
   *  a {PreventedResult} if it was prevented by some plugin.
   * @memberof MongoRepository
   */
  async listArchive(
    pipeline = [] as Document[],
    postPipeline = [] as Document[],
  ): Promise<TEntity[] | PreventedResult> {
    await this.ensureDbAndCollection();
    let collection: Collection<TEntity>;

    if (this.manager) {
      const client = await this.manager.getClient(OnlineArchiveConnectionType.Federated);
      collection = client.db(this.dbName).collection(this.collectionName);
    } else {
      collection = this.collection;
    }

    const prePipeline = [
      ...pipeline,
      {
        $match: { '_meta.status': LifecycleStages.ARCHIVED },
      },
      ...postPipeline,
    ];

    const preventResult = await callPluginHooks<OnBeforeListHook>(
      'onBeforeListHook',
      this.plugins,
      async hook => hook(prePipeline),
    );
    if (preventResult) return preventResult;

    const finalPipeline = [...prePipeline, ...postPipeline];
    const result = await collection.aggregate(finalPipeline).toArray();

    await callPluginHooks<OnAfterListHook>(
      'onAfterListHook',
      this.plugins,
      async hook => hook(finalPipeline, result),
    );

    return result as TEntity[];
  }

  /**
   * List documents of collection using the MongoDB's Aggregation, given an aggregation pipeline.
   *  Results are not filtered, including documents of any LifecycleStage. If a connection manager
   *   was set to the repository, it will try to use the Federated connection.
   * @param [pipeline=[] as Document[]]} The initial pipeline agreggation to execute.
   * @param [postPipeline=[] as Document[]] An additional pipeline aggregation to execute after
   *  plugins injected other pipelines.
   * @return {(Promise<TEntity[] | PreventedResult>)} The documents returned by the aggregation or
   *  a {PreventedResult} if it was prevented by some plugin.
   * @memberof MongoRepository
   */
  async listAll(
    pipeline = [] as Document[],
    postPipeline = [] as Document[],
  ): Promise<TEntity[] | PreventedResult> {
    await this.ensureDbAndCollection();

    let collection: Collection<TEntity>;

    if (this.manager) {
      const client = await this.manager.getClient(OnlineArchiveConnectionType.Federated);
      collection = client.db(this.dbName).collection(this.collectionName);
    } else {
      collection = this.collection;
    }

    const prePipeline = [
      ...pipeline,
      {
        $match: { '_meta.status': { $exists: true } },
      },
      ...postPipeline,
    ];

    const preventResult = await callPluginHooks<OnBeforeListHook>(
      'onBeforeListHook',
      this.plugins,
      async hook => hook(prePipeline),
    );
    if (preventResult) return preventResult;

    const finalPipeline = [...prePipeline, ...postPipeline];
    const result = await collection.aggregate(finalPipeline).toArray();

    await callPluginHooks<OnAfterListHook>(
      'onAfterListHook',
      this.plugins,
      async hook => hook(finalPipeline, result),
    );

    return result as TEntity[];
  }

  /**
   * Creates and inserts a clone from an existing document, preseving its "ancestor" identity and
   *  removing all the metadata. Useful for document version control.
   * @param id Original document object to clone.
   * @param options `insertOne` options.
   * @returns The created clone from the original object.
   */
  async branch(id: InferIdType<TEntity>, options?: Document) {
    const result = await this.get(id) as TEntity;

    Reflect.deleteProperty(result, '_id');
    EntityWithLifecycle.resetMetadata(result);
    result._meta.ancestor = id;

    return this.insertOne(result as OptionalUnlessRequiredId<TEntity>, options);
  }

  async publishById(id: InferIdType<TEntity>, options?: Document) {
    const patch = EntityWithLifecycle.publish({}, options);
    return this.patchOneById(id, patch);
  }

  async archiveById(id: InferIdType<TEntity>, options?: Document) {
    const patch = EntityWithLifecycle.archive({}, options);
    return this.patchOneById(id, patch);
  }

  async unpublishById(id: InferIdType<TEntity>, options?: Document) {
    const patch = EntityWithLifecycle.unpublish({}, options);
    return this.patchOneById(id, patch);
  }

  async unarchiveToDraft(id: InferIdType<TEntity>, options?: Document) {
    return this.unpublishById(id, options);
  }

  async unarchiveToPublished(id: InferIdType<TEntity>, options?: Document) {
    return this.publishById(id, options);
  }
}
