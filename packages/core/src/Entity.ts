// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-classes-per-file */
import { Document, EJSON, ObjectId } from 'bson';
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
  _: Document;
}

export interface IClonableEntity {
  initializeClone(clone: Document): void;
}

/**
 * An Entity class which can be instantiated with an existing object with the same attributes.
 * @export
 * @class ClonableEntity
 * @implements {IEntity<Identity>}
 * @template T Entity type.
 * @template Identity Entity identity type.
 */
export class ClonableEntity<T extends IEntity<Identity>, Identity> implements
  IEntity<Identity>, IClonableEntity {
  readonly _id: Identity;

  /**
   * Creates an instance of ClonableEntity.
   * @param {() => Identity} identityFactory Function that creates a new identity for the entity.
   * @param {Partial<T>} [obj] Existing object to clone and create an entity instance.
   * @memberof ClonableEntity
   */
  constructor(identityFactory: (() => Identity) | null, obj?: Partial<T>) {
    if (obj && !obj._id) {
      throw new Error('Missing object _id for cloning');
    }
    if (obj) {
      this.initializeClone(obj as Document);
    }
    if (!obj && identityFactory) {
      this._id = identityFactory();
    }
  }

  initializeClone(clone: Document): void {
    // TODO: stringify is not a good cloning algorithm, but it should preserve native
    // bson types
    const deepClone = EJSON.parse(EJSON.stringify(clone));
    const keys = Object.keys(deepClone);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      this[key] = deepClone[key];
    }
  }

  _: Document;

  /**
   * Parses an identity string into the identity type.
   * Currently supports ObjectId, number and string.
   * @static
   * @param {string} id Identity string to parse.
   * @return {number | ObjectId | string} Parsed identity.
   * @memberof ClonableEntity
   */
  static parseId(id: string): number | ObjectId | string {
    const isObjectId = ObjectId.isValid(id);
    const isNumber = !Number.isNaN(Number(id));
    if (isObjectId) {
      return new ObjectId(id);
    }
    if (isNumber) {
      return Number(id);
    }
    return id;
  }
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

  static parseId(id: string) {
    return new ObjectId(id);
  }
}

/**
 * A constructor with an object argument to optionally clone from.
 * @export
 * @interface ClonableConstructor
 * @template TEntity Type of instance created from constructor.
 */
export interface ClonableConstructor<TEntity> {
  new(obj?: Partial<TEntity>): TEntity;
}

/**
 * Determines wheter an object is an entity or not
 * @param o object to check
 * @returns true if is an entity
 */
export function isEntity<Identity>(o: unknown): o is IEntity<Identity> {
  return Object.prototype.hasOwnProperty.call(o, '_id') as boolean;
}

/**
 * Represents an entity that has external identities (ie: it represents a person inside its domain
 * but a "contact" inside another domain)
 * @export
 * @interface IEntityWithExternalIds
 */
export interface IEntityWithExternalIds {
  _eids?: ExternalIds;
}

/**
 * External IDs object
 * @example {
 *  google: {
 *    user: 'id'
 *  }
 * }
 */
export type ExternalIds = {
  /**
   * realm: the domain of the external IDs
   * @example 'google'
   */
  [realm: string]: {
    /**
     * type: the entity that the external ID represents inside the realm
     * @example 'user'
     */
    [type: string]: Complex,
  },
};
