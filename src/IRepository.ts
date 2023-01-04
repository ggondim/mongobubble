import { Document, ObjectId } from 'bson';
import {
  Collection, Db, OptionalUnlessRequiredId, Filter, UpdateResult, DeleteResult, InferIdType,
} from 'mongodb';
import { IRepositoryPlugin } from './IRepositoryPlugin';
import { JsonPatchOperation } from './MongoDbUtils';
import { Primitive } from './Utils';
import PreventedResult from './PreventedResult';
import { ClonableConstructor } from './Entity';

export default interface IRepository<TEntity> {
  EntityClass: ClonableConstructor<TEntity>;

  collection: Collection<TEntity>;

  db: Db;

  plugins: IRepositoryPlugin[];

  insertOne(
    document: OptionalUnlessRequiredId<TEntity>,
    options?: Document,
  ): Promise<OptionalUnlessRequiredId<TEntity> | PreventedResult>;

  insertMany(
    documents: OptionalUnlessRequiredId<TEntity>[],
    options?: Document,
  ): Promise<OptionalUnlessRequiredId<TEntity>[] | PreventedResult>;

  patchOne(
    filter: Filter<TEntity>,
    documentSetProperties: Partial<TEntity>,
  ): Promise<Document | PreventedResult>;
  patchOne(
    filter: Filter<TEntity>,
    jsonPatchOperations: JsonPatchOperation[],
  ): Promise<Document | PreventedResult>;
  patchOne(
    filter: Filter<TEntity>,
    operationsOrDocumentPatch: JsonPatchOperation[] | Partial<TEntity>,
  ): Promise<Document | PreventedResult>;

  patchMany(
    filter: Filter<TEntity>,
    documentSetProperties: Partial<TEntity>,
  ): Promise<UpdateResult | PreventedResult>;
  patchMany(
    filter: Filter<TEntity>,
    jsonPatchOperations: JsonPatchOperation[],
  ): Promise<UpdateResult | PreventedResult>;
  patchMany(
    filter: Filter<TEntity>,
    operationsOrDocumentPatch: JsonPatchOperation[] | Partial<TEntity>,
  ): Promise<UpdateResult | PreventedResult>;

  replaceOne(document: OptionalUnlessRequiredId<TEntity>): Promise<UpdateResult | PreventedResult>;

  deleteOne(
    idOrDocument: ObjectId | Primitive | Filter<TEntity>,
  ): Promise<DeleteResult | PreventedResult>;

  list<TResult = TEntity>(
    pipeline: Document[],
    postPipeline: Document[],
  ): Promise<TResult[] | PreventedResult>;

  get(
    id: InferIdType<TEntity>,
  ): Promise<TEntity | PreventedResult>;
  // eslint-disable-next-line semi
}
