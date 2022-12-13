/* eslint-disable max-classes-per-file */
// TODO: JSON Schema validation
// TODO: JSON Schema mongotype conversion
// TODO: Relationship mapping
// TODO: plugin: timstamps metadata
// TODO: plugin: lifecycle metadata (status)
// TODO: plugin: external id metadata
// TODO: plugin: versioning metadata
// TODO: plugin: schema metadata
// TODO: plugin: source metadata
// TODO: plugin: ancestor metadata

import { Document } from 'bson';
import { Collection, Db, InsertOneResult, ObjectId, OptionalUnlessRequiredId } from 'mongodb';
import { ClonableEntity, IEntity, ObjectIdEntity } from './Entity';

export default class MongoRepository {
  static async create<TEntity extends Document>(
    collection: Collection<TEntity>,
    document: TEntity,
    {
      schema,
      bypassValidation,
      out,
    } = {} as {
      schema?: object,
      bypassValidation?: boolean,
      out?: { result: InsertOneResult<TEntity> }
    },
  ): Promise<void> {
    if (schema && !bypassValidation) {
      MongoRepository.validate(document);
    }

    const result = await collection.insertOne(document as OptionalUnlessRequiredId<TEntity>);
    if (out) out.result = result;
  }

  static validate<TEntity extends Document>(
    document: TEntity,
   ) {
    throw new Error('Method not implemented.');
  }
}

class User extends ObjectIdEntity<User> {
  name: string;
}

const user = new User();

const userRepository = new MongoRepository<User>('users', db)
