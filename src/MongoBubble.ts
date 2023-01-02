import { Document, ObjectId } from 'bson';
import { InferIdType, OptionalUnlessRequiredId } from 'mongodb';
import MongoRepository from './MongoRepository';
import PreventedResult from './PreventedResult';
import { EntityWithLifecycle, LifecycleStages } from './plugins/lifecycle/EntityWithLifecycle';
import { OnlineArchiveConnectionType } from './plugins/onlinearchive/OnlineArchiveManager';
import { OnBeforeListHook, OnAfterListHook } from './IRepositoryPlugin';
import { callPluginHooks } from './RepositoryPluginUtils';

export default class MongoBubble<
  TEntity extends EntityWithLifecycle<TEntity, Identity>,
  Identity = ObjectId> extends MongoRepository<TEntity> {
  async listDrafts<TResult = TEntity>(
    pipeline = [] as Document[],
    postPipeline = [] as Document[],
  ): Promise<TResult[] | PreventedResult> {
    return this.list([
      ...pipeline,
      {
        $match: { '_meta.status': LifecycleStages.DRAFT },
      },
      postPipeline,
    ]);
  }

  async listArchive<TResult = TEntity>(
    pipeline = [] as Document[],
    postPipeline = [] as Document[],
  ): Promise<TResult[] | PreventedResult> {
    const client = await this.manager.getClient(OnlineArchiveConnectionType.Federated);
    const collection = client.db(this.dbName).collection(this.collectionName);

    const prePipeline = [
      ...pipeline,
      {
        $match: { '_meta.status': LifecycleStages.ARCHIVED },
      },
      postPipeline,
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

    return result as TResult[];
  }

  async listAll<TResult = TEntity>(
    pipeline = [] as Document[],
    postPipeline = [] as Document[],
  ): Promise<TResult[] | PreventedResult> {
    const client = await this.manager.getClient(OnlineArchiveConnectionType.Federated);
    const collection = client.db(this.dbName).collection(this.collectionName);

    const prePipeline = [
      ...pipeline,
      {
        $match: { '_meta.status': { $exists: true } },
      },
      postPipeline,
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

    return result as TResult[];
  }

  async branch(id: InferIdType<TEntity>, options?: Document) {
    const result = await this.get(id) as TEntity;

    Reflect.deleteProperty(result, '_id');
    EntityWithLifecycle.resetMetadata(result);
    result._meta.ancestor = id;

    return this.insertOne(result as OptionalUnlessRequiredId<TEntity>, options);
  }
}
