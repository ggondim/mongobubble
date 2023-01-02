// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-classes-per-file */
import { ObjectId } from 'bson';
import { Complex } from './Utils';

/**
 * Represents an entity type with an identity.
 * @export
 * @interface IEntity
 * @template [Identity=ObjectId] The identity type of the entity. Defaults to an ObjectId.
 */
export interface IEntity<Identity = ObjectId> {
  /**
   * Unique identity of the object (a.k.a. primary key)
   * @type {Identity}
   * @memberof IEntity
   */
  _id: Identity;

  // The primary key was named _id inspired from MongoDB and to make sure there will be no
  // conflict with other ID/Id/id properties acting as primary keys

  /**
   * Denormalized data.
   * @type {Record<string, any>}
   * @memberof IEntity
   */
  _: Record<string, unknown>;
}

/**
 * An Entity class which can be instantiated with an existing object with the same attributes.
 * @export
 * @class ClonableEntity
 * @implements {IEntity<Identity>}
 * @template T Entity type.
 * @template Identity Entity identity type.
 */
export class ClonableEntity<T extends IEntity<Identity>, Identity> implements IEntity<Identity> {
  readonly _id: Identity;

  /**
   * Creates an instance of ClonableEntity.
   * @param {() => Identity} identityFactory Function that creates a new identity for the entity.
   * @param {Partial<T>} [obj] Existing object to clone and create an entity instance.
   * @memberof ClonableEntity
   */
  constructor(identityFactory: () => Identity, obj?: Partial<T>) {
    if (obj) Object.assign(this, obj);
    if (obj && !obj._id) {
      if (identityFactory) {
        this._id = identityFactory();
      } else {
        throw new Error('Missing object _id for cloning');
      }
    }
  }

  _: Record<string, unknown>;
}

/**
 * A {ClonableEntity} with ObjectId as the Identity type.
 * @export
 * @class ObjectIdEntity
 * @extends {ClonableEntity<T, ObjectId>}
 * @template T Entity type.
 */
export class ObjectIdEntity<T extends IEntity> extends ClonableEntity<T, ObjectId> {
  /**
   * Creates an instance of ObjectIdEntity.
   * @param {Partial<T>} [obj] Existing object to clone and create an entity instance.
   * @memberof ObjectIdEntity
   */
  constructor(obj?: Partial<T>) {
    super(null, obj);
  }
}

export function isEntity<Identity>(o: unknown): o is IEntity<Identity> {
  return Object.prototype.hasOwnProperty.call(o, '_id') as boolean;
}
export interface IEntityWithExternalIds {
  _eids: ExternalIds;
}

export type ExternalIds = {
  [realm: string]: {
    [type: string]: Complex,
  },
};
