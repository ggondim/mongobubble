import { Document } from 'bson';
import { InsertManyResult, InsertOneResult, UpdateResult } from 'mongodb';
import { JsonPathOperation } from './JsonPath';
import { getMethods, Primitive } from './Utils';

export type InsertOneOrManyResult = InsertOneResult | InsertManyResult;

export type onBeforeInsertHook = (document: Document) => void | Promise<void>;

export type onBeforePatchHook = (
  patch: JsonPathOperation[],
  mongoUpdate: Document,
) => void | Promise<void>;

export type onBeforeReplaceHook = (document: Document) => void | Promise<void>;

export type onBeforeDeleteHook = (identity: Primitive) => void | Promise<void>;

export type onAfterInsertHook = (
  result: InsertOneOrManyResult,
  document: Document,
) => void | Promise<void>;

export type onAfterPatchHook = (
  result: UpdateResult,
  patch: JsonPathOperation[],
  mongoUpdate: Document,
) => void | Promise<void>;

export type onAfterReplaceHook = (result: UpdateResult, document: Document) => void | Promise<void>;

export type onAfterDeleteHook = (result: UpdateResult, document: Document) => void | Promise<void>;

export interface IRepositoryPlugin {
  PLUGIN_NAME: string;

  onBeforeInsert: undefined | onBeforeInsertHook;
  onBeforePatch: undefined | onBeforePatchHook;
  onBeforeReplace: undefined | onBeforeReplaceHook;
  onBeforeDelete: undefined | onBeforeDeleteHook;

  onAfterInsert: undefined | onAfterInsertHook;
  onAfterPatch: undefined | onAfterPatchHook;
  onAfterReplace: undefined | onAfterReplaceHook;
  onAFterDelete: undefined | onAfterDeleteHook;
}

export class RepositoryPlugin {
  options: Document;

  constructor(options: Document = {}) {
    this.options = options;
  }

  implementedHooks(): string[] {
    return getMethods(this).filter(m => m.startsWith('on'));
  }
}
