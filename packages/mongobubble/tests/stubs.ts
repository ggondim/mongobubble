/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable max-classes-per-file */
import { ObjectIdEntity, ClonableEntity } from '@mongobubble/core/dist/Entity';
import { EntityWithLifecycle } from '../src/EntityWithLifecycle';

export class UserOid extends ObjectIdEntity<UserOid> {
  static COLLECTION = 'users' as const;

  name: string;
}

export function identityFactory() {
  return 'IDENTITY';
}

export class UserClonable extends ClonableEntity<UserClonable, string> {
  name: string;

  constructor(obj?: Partial<UserClonable>) {
    super(identityFactory, obj);
  }
}

export class UserWithMetadata extends EntityWithLifecycle<UserWithMetadata> {
  static COLLECTION = 'users' as const;

  name: string;
}
