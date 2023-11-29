import { Document, ObjectId } from 'bson';
import {
  Collection,
  Db,
  OptionalUnlessRequiredId,
  Filter,
  UpdateResult,
  DeleteResult,
  InferIdType,
  UpdateOptions,
} from 'mongodb';
import { IRepositoryPlugin } from './IRepositoryPlugin';
import { JsonPatchOperation } from './MongoDbUtils';
import { Primitive } from './Utils';
import PreventedResult from './PreventedResult';
import { ClonableConstructor } from './Entity';

export default interface IRepository<TEntity> {
  EntityClass?: ClonableConstructor<TEntity>;

  collection: Collection<TEntity>;

  db: Db;

  plugins: IRepositoryPlugin[];

  // POST
  insertOne(
    document: OptionalUnlessRequiredId<TEntity>,
    options?: Document,
  ): Promise<OptionalUnlessRequiredId<TEntity> | PreventedResult>;

  insertMany(
    documents: OptionalUnlessRequiredId<TEntity>[],
    options?: Document,
  ): Promise<OptionalUnlessRequiredId<TEntity>[] | PreventedResult>;

  // PATCH /:id
  patchOneById(
    id: InferIdType<TEntity>,
    documentSetProperties: Partial<TEntity>,
    options?: Document & UpdateOptions,
  ): Promise<Document | PreventedResult>;
  patchOneById(
    id: InferIdType<TEntity>,
    jsonPatchOperations: JsonPatchOperation[],
    options?: Document & UpdateOptions,
  ): Promise<Document | PreventedResult>;
  patchOneById(
    id: InferIdType<TEntity>,
    operationsOrDocumentPatch: JsonPatchOperation[] | Partial<TEntity>,
    options?: Document & UpdateOptions,
  ): Promise<Document | PreventedResult>;

  // PATCH
  patchOne(
    filter: Filter<TEntity>,
    documentSetProperties: Partial<TEntity>,
    options?: Document & UpdateOptions,
  ): Promise<Document | PreventedResult>;
  patchOne(
    filter: Filter<TEntity>,
    jsonPatchOperations: JsonPatchOperation[],
    options?: Document & UpdateOptions,
  ): Promise<Document | PreventedResult>;
  patchOne(
    filter: Filter<TEntity>,
    operationsOrDocumentPatch: JsonPatchOperation[] | Partial<TEntity>,
    options?: Document & UpdateOptions,
  ): Promise<Document | PreventedResult>;

  // PATCH
  patchMany(
    filter: Filter<TEntity>,
    documentSetProperties: Partial<TEntity>,
    options?: Document & UpdateOptions,
  ): Promise<UpdateResult | PreventedResult>;
  patchMany(
    filter: Filter<TEntity>,
    jsonPatchOperations: JsonPatchOperation[],
    options?: Document & UpdateOptions,
  ): Promise<UpdateResult | PreventedResult>;
  patchMany(
    filter: Filter<TEntity>,
    operationsOrDocumentPatch: JsonPatchOperation[] | Partial<TEntity>,
    options?: Document & UpdateOptions,
  ): Promise<UpdateResult | PreventedResult>;

  // PUT
  replaceOne(
    document: OptionalUnlessRequiredId<TEntity>,
    options?: Document,
  ): Promise<UpdateResult | PreventedResult>;

  deleteOne(
    idOrDocument: ObjectId | Primitive | Filter<TEntity>,
    options?: Document,
  ): Promise<DeleteResult | PreventedResult>;

  // GET
  list(
    pipeline: Document[],
    postPipeline: Document[],
  ): Promise<TEntity[] | PreventedResult>;

  // GET
  query<TResult = TEntity>(
    pipeline: Document[],
    postPipeline: Document[],
  ): Promise<TResult[] | PreventedResult>;

  // GET
  get(
    id: InferIdType<TEntity>,
  ): Promise<TEntity | PreventedResult>;
  // eslint-disable-next-line semi
}
