import { describe, expect, test, beforeAll, afterAll, afterEach } from '@jest/globals';
import { Db, MongoClient } from 'mongodb';
import { UserWithMetadata } from './stubs';
import MongoBubble from '../src/MongoBubble';
import { LogLevel } from '../src/Utils';
import { LifecycleStages } from '../src/plugins/lifecycle/EntityWithLifecycle';

const URI = 'mongodb://localhost';

let client: MongoClient;
let db: Db;

async function dropCollections() {
  const collections = await db.collections();
  await Promise.all(collections.map(collection => collection.drop()));
}

function newUserRepository() {
  return new MongoBubble<UserWithMetadata>(UserWithMetadata, {
    db,
    logLevel: LogLevel.Error,
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
  test('list published', async () => {
    const repository = newUserRepository();

    const user = new UserWithMetadata();
    user.name = 'Gustavo';

    await repository.insertOne(user) as UserWithMetadata;

    const results = await repository.list() as UserWithMetadata[];
    expect(results).toHaveLength(0);
  });

  test('list drafts', async () => {
    const repository = newUserRepository();

    const user = new UserWithMetadata();
    user.name = 'Gustavo';

    await repository.insertOne(user) as UserWithMetadata;

    const listDrafts = await repository.listDrafts() as UserWithMetadata[];
    expect(listDrafts).toHaveLength(1);

    const listPublished = await repository.list() as UserWithMetadata[];
    expect(listPublished).toHaveLength(0);
  });

  test('list archive', async () => {
    const repository = newUserRepository();

    const user = new UserWithMetadata();
    user.name = 'Gustavo';
    user.archive();

    await repository.insertOne(user) as UserWithMetadata;

    const listArchive = await repository.listArchive() as UserWithMetadata[];
    expect(listArchive).toHaveLength(1);

    const listPublished = await repository.list() as UserWithMetadata[];
    expect(listPublished).toHaveLength(0);
  });

  test('list all', async () => {
    const repository = newUserRepository();

    const user = new UserWithMetadata();
    user.name = 'Gustavo';
    user.archive();

    await repository.insertOne(user) as UserWithMetadata;

    const results = await repository.listAll() as UserWithMetadata[];
    expect(results).toHaveLength(1);
  });

  test('branch', async () => {
    const repository = newUserRepository();

    const user1 = new UserWithMetadata();
    user1.name = 'Gustavo';
    user1.archive();

    await repository.insertOne(user1) as UserWithMetadata;

    const user2 = await repository.branch(user1._id) as UserWithMetadata;

    expect(user2._id).not.toEqual(user1._id);
    expect(user2.name).toEqual(user1.name);
    expect(user2._meta.status).toEqual(LifecycleStages.DRAFT);
  });
})

