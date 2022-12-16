import { PrimitiveValidIndexSignature } from './Utils';

export type JsonPathOperation = {
  op: 'add' | 'remove' | 'replace',
  path: string,
  value?: Record<PrimitiveValidIndexSignature, unknown>,
};
