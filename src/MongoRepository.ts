// TODO: JSON Schema mongotype conversion
// TODO: Relationship mapping
// TODO: plugin: timstamps metadata
// TODO: plugin: lifecycle metadata (status)
// TODO: plugin: external id metadata
// TODO: plugin: versioning metadata
// TODO: plugin: schema metadata
// TODO: plugin: source metadata
// TODO: plugin: ancestor metadata

// #region [rgba(200,200,200,0.2)] IMPORTS

import { Document, ObjectId } from 'bson';
import {
  Collection,
  Db,
  DeleteResult,
  Filter,
  InsertManyResult,
  InsertOneResult,
  MatchKeysAndValues,
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
  OnAfterInsertHook,
  OnAfterPatchHook,
  OnAfterReplaceHook,
  OnBeforeDeleteHook,
  OnBeforeInsertHook,
  OnBeforePatchHook,
  OnBeforeReplaceHook,
}
  from './IRepositoryPlugin';
import { Primitive } from './Utils';
import { DefaultPlugins, callPluginHooks, initializePlugins } from './RepositoryPluginUtils';
import IRepository from './IRepository';
import PreventedResult from './PreventedResult';
// #endregion

type MongoRepositoryOptions = {
  overrideDefaultPlugins?: DefaultPlugins[];
  plugins?: IRepositoryPlugin[];
};

export default class MongoRepository<TEntity> implements IRepository<TEntity> {
  collection: Collection<TEntity>;

  db: Db;

  plugins: IRepositoryPlugin[];

  constructor(collectionName: string, db: Db, options?: Document & MongoRepositoryOptions) {
    this.db = db;
    this.collection = db.collection(collectionName);

    const defPlugins = options.overrideDefaultPlugins || DefaultPlugins;

    this.plugins = [
      ...((options.plugins || []) as IRepositoryPlugin[]),
      ...initializePlugins(this, Object.keys(defPlugins) as DefaultPlugins[]),
    ];
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
}
