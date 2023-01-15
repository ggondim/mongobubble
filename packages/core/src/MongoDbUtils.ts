import { InsertManyResult, InsertOneResult } from 'mongodb';
import { Complex } from './Utils';

export type InsertOneOrManyResult = InsertOneResult | InsertManyResult;

export type JsonPatchOperation = {
  op: 'add' | 'remove' | 'replace',
  path: string,
  value?: Complex,
};
