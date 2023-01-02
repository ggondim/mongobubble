// #region [rgba(0,0,255,0.2)] HOOK TYPES

import { Document, ObjectId } from 'bson';
import { UpdateResult, DeleteResult, UpdateFilter } from 'mongodb';
import { JsonPatchOperation, InsertOneOrManyResult } from './MongoDbUtils';
import { Complex, Primitive } from './Utils';

export type OnBeforeInsertHook = (
  documentOrDocuments: Document | Document[],
  options?: Document,
) => void | boolean | Promise<void | Complex>;

export type OnBeforePatchHook<TEntity = Document> = (
  patch: JsonPatchOperation[] | null,
  mongoUpdate: UpdateFilter<TEntity>,
  options?: Document,
) => void | Promise<void | Complex>;

export type OnBeforeReplaceHook = (
  documentOrDocuments: Document | Document[],
  options?: Document,
) => void | Promise<void | Complex>;

export type OnBeforeDeleteHook = (
  identity: ObjectId | Primitive | Document,
  options?: Document,
) => void | Promise<void | Complex>;

export type OnBeforeListHook = (
  pipeline?: Document[],
  postPipeline?: Document[],
) => void | Promise<void | Complex>;

export type OnBeforeGetHook = (
  id: unknown,
) => void | Promise<void | Complex>;

export type OnAfterInsertHook = (
  result: InsertOneOrManyResult,
  document: Document,
) => void | Promise<void>;

export type OnAfterPatchHook = (
  result: Document | UpdateResult,
  patch: JsonPatchOperation[],
  mongoUpdate: Document,
) => void | Promise<void>;

export type OnAfterReplaceHook = (
  result: UpdateResult,
  documentOrDocuments: Document | Document[],
) => void | Promise<void>;

export type OnAfterDeleteHook = (
  result: DeleteResult,
  idOrDocument: ObjectId | Primitive | Document,
) => void | Promise<void>;

export type OnAfterListHook = (
  finalPipeline: Document[],
  result: Document[],
) => void | Promise<void>;

export type OnAfterGetHook = (
  result: Document,
) => void | Promise<void>;

// #endregion

export interface IRepositoryPlugin {
  PLUGIN_NAME: string;

  onBeforeInsert: undefined | OnBeforeInsertHook;
  onBeforePatch: undefined | OnBeforePatchHook;
  onBeforeReplace: undefined | OnBeforeReplaceHook;
  onBeforeDelete: undefined | OnBeforeDeleteHook;
  onBeforeList: undefined | OnBeforeListHook;
  onBeforeGet: undefined | OnBeforeGetHook;

  onAfterInsert: undefined | OnAfterInsertHook;
  onAfterPatch: undefined | OnAfterPatchHook;
  onAfterReplace: undefined | OnAfterReplaceHook;
  onAFterDelete: undefined | OnAfterDeleteHook;
  onAfterList: undefined | OnBeforeListHook;
  onAfterGet: undefined | OnAfterGetHook;
}
