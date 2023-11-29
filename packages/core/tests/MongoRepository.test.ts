import { describe, expect, test, beforeAll, afterAll, afterEach } from '@jest/globals';
import { Db, MongoClient } from 'mongodb';
import { UserClonable, UserOid } from './stubs';
import MongoRepository from '../src/MongoRepository';
import { LogLevel } from '../src/Utils';
import { JsonPatchOperation } from '../src/MongoDbUtils';

const URI = 'mongodb://localhost';

let client: MongoClient;
let db: Db;

async function dropCollections() {
  const collections = await db.collections();
  await Promise.all(collections.map(collection => collection.drop()));
}

function newUserRepository() {
  return new MongoRepository({
    db,
    logLevel: LogLevel.Error,
    EntityClass: UserOid,
  });
}

beforeAll(async () => {
  client = await MongoClient.connect(URI);
  db = client.db('mongobubble');
  await dropCollections();
})

afterEach(async () => {
  await dropCollections();
});

afterAll(async () => {
  await client.close();
});

describe('MongoRepository', () => {
  test('default initialization', () => {
    const repository = newUserRepository();

    expect(repository.db.databaseName).toBe('mongobubble');
  });

  test('wrong initialization', () => {
    const t = () => {
      new MongoRepository({
        EntityClass: UserClonable,
        db,
        logLevel: LogLevel.Error,
      });
    };

    // UserClonable doesn't defines a `COLLECTION` property, so it should throw error
    expect(t).toThrowError();
  });

  test('insertOne', async () => {
    const repository = newUserRepository();

    const user = new UserOid();
    user.name = 'Gustavo';

    const repoResult = await repository.insertOne(user);
    expect(user._id).toBeDefined();
    expect(repoResult).toBeDefined();
    expect(repoResult.name).toBeDefined();

    const mongoResult = await db.collection('users').findOne(repoResult._id);
    expect(mongoResult).toBeDefined();
    expect(mongoResult?.name).toBeDefined();

    expect(repoResult.name).toEqual(mongoResult?.name);
  });

  test('insertMany', async () => {
    const repository = newUserRepository();

    const user1 = new UserOid();
    user1.name = 'Gustavo';

    const user2 = new UserOid();
    user2.name = 'Gondim';

    const repoResult = await repository.insertMany([user1, user2]);
    expect(user1._id).toBeDefined();
    expect(user2._id).toBeDefined();

    const mongoResult = await db.collection('users').find({
      name: { $in: ['Gustavo', 'Gondim'] }
    }).toArray();

    expect(repoResult.length).toEqual(mongoResult.length);
  });

  test('patchOne with mongoSet', async () => {
    const repository = newUserRepository();

    const user = new UserOid();
    user.name = 'Gustavo';

    await repository.insertOne(user);

    const patchResult = await repository.patchOne({ _id: user._id }, { name: 'Gondim' });
    expect(patchResult).toBeDefined();

    const mongoResult = await db.collection('users').findOne(user._id);
    expect(mongoResult).toBeDefined();
    expect(mongoResult?.name).toEqual('Gondim');
  });

  test('patchOne with json patch', async () => {
    const repository = newUserRepository();

    const user = new UserOid();
    user.name = 'Gustavo';

    await repository.insertOne(user);

    const jsonPatch = {
      op: 'replace',
      path: '/name',
      value: 'Gondim',
    } as JsonPatchOperation;
    const patchResult = await repository.patchOne({ _id: user._id }, [jsonPatch]);
    expect(patchResult).toBeDefined();

    const mongoResult = await db.collection('users').findOne(user._id);
    expect(mongoResult).toBeDefined();
    expect(mongoResult?.name).toEqual('Gondim');

    const jsonPatch2 = {
      op: 'remove',
      path: '/name',
    } as JsonPatchOperation;
    const patchResult2 = await repository.patchOne({ _id: user._id }, [jsonPatch2]);
    expect(patchResult2).toBeDefined();

    const mongoResult2 = await db.collection('users').findOne(user._id);
    expect(mongoResult2).toBeDefined();
    expect(mongoResult2?.name).toBeUndefined();
  });

  test('patchOneById with mongoSet', async () => {
    const repository = newUserRepository();

    const user = new UserOid();
    user.name = 'Gustavo';

    await repository.insertOne(user);

    const patchResult = await repository.patchOneById(user._id, { name: 'Gondim2' });
    expect(patchResult).toBeDefined();

    const mongoResult = await db.collection('users').findOne(user._id);
    expect(mongoResult).toBeDefined();
    expect(mongoResult?.name).toEqual('Gondim2');
  });

  test('patchOneById with json patch', async () => {
    const repository = newUserRepository();

    const user = new UserOid();
    user.name = 'Gustavo';

    await repository.insertOne(user);

    const jsonPatch = {
      op: 'replace',
      path: '/name',
      value: 'Gondim3',
    } as JsonPatchOperation;
    const patchResult = await repository.patchOneById(user._id, [jsonPatch]);
    expect(patchResult).toBeDefined();

    const mongoResult = await db.collection('users').findOne(user._id);
    expect(mongoResult).toBeDefined();
    expect(mongoResult?.name).toEqual('Gondim3');

    const jsonPatch2 = {
      op: 'remove',
      path: '/name',
    } as JsonPatchOperation;
    const patchResult2 = await repository.patchOne({ _id: user._id }, [jsonPatch2]);
    expect(patchResult2).toBeDefined();

    const mongoResult2 = await db.collection('users').findOne(user._id);
    expect(mongoResult2).toBeDefined();
    expect(mongoResult2?.name).toBeUndefined();
  });

  test('patchMany with mongoSet', async () => {
    const repository = newUserRepository();

    const user1 = new UserOid();
    user1.name = 'Gustavo';

    const user2 = new UserOid();
    user2.name = 'Gondim';

    await repository.insertMany([user1, user2]);

    const patchResult = await repository.patchMany({}, { name: 'Simões' });
    expect(patchResult).toBeDefined();

    const mongoResult = await db.collection('users').find().toArray();
    expect(mongoResult).toHaveLength(2);
    mongoResult.forEach(d => expect(d?.name).toEqual('Simões'));
  });

  test('patchMany with json patch', async () => {
    const repository = newUserRepository();

    const user1 = new UserOid();
    user1.name = 'Gustavo';

    const user2 = new UserOid();
    user2.name = 'Gondim';

    await repository.insertMany([user1, user2]);

    const jsonPatch = {
      op: 'replace',
      path: '/name',
      value: 'Simões',
    } as JsonPatchOperation;
    const patchResult = await repository.patchMany({}, [jsonPatch]);
    expect(patchResult).toBeDefined();

    const mongoResult = await db.collection('users').find().toArray();
    expect(mongoResult).toHaveLength(2);
    mongoResult.forEach(d => expect(d?.name).toEqual('Simões'));
  });

  test('replaceOne with mongoSet', async () => {
    const repository = newUserRepository();

    const user1 = new UserOid();
    user1.name = 'Gustavo';

    await repository.insertOne(user1);

    const user2 = new UserOid(user1);
    user2.name = 'Gondim';

    const replaceResult = await repository.replaceOne(user2);
    expect(replaceResult).toBeDefined();

    const mongoResult = await db.collection('users').findOne(user1._id);
    expect(mongoResult).toBeDefined();
    expect(mongoResult?.name).toEqual('Gondim');
  });

  test('deleteOneById', async () => {
    const repository = new MongoRepository({
      EntityClass: UserOid,
      db,
      logLevel: LogLevel.Error,
      softDelete: false,
    });

    const user = new UserOid();

    const repoResult = await repository.insertOne(user);

    const deleteResult = await repository.deleteOneById(user._id);
    expect(deleteResult).toBeDefined();

    const mongoResult = await db.collection('users').findOne(user._id);
    expect(mongoResult).toBeFalsy();
  });

  test('deleteOne', async () => {
    const repository = new MongoRepository({
      EntityClass: UserOid,
      db,
      logLevel: LogLevel.Error,
      softDelete: false,
    });

    const user = new UserOid();
    user.name = 'Gustavo';

    const repoResult = await repository.insertOne(user);

    const deleteResult = await repository.deleteOne({ name: user.name });
    expect(deleteResult).toBeDefined();

    const mongoResult = await db.collection('users').findOne(user._id);
    expect(mongoResult).toBeFalsy();
  });

  test('get', async () => {
    const repository = newUserRepository();

    const user = new UserOid();
    user.name = 'Gustavo';

    const repoResult = await repository.insertOne(user);

    const user2 = await repository.get(user._id);
    expect(user2).not.toBeNull();
    expect(user2).toBeDefined();
    expect(user2?._id).toEqual(user._id);
  });
})

