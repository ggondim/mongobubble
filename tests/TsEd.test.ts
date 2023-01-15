import { describe, expect, test, beforeAll, afterAll, afterEach } from '@jest/globals';
import { MaxLength, MinLength, getJsonSchema, Property, Required } from "@tsed/schema";
import { Db, MongoClient } from 'mongodb';
import { ObjectIdEntity } from '../src/Entity';
import MongoRepository from '../src/MongoRepository';
import TsEdPlugin from '../src/plugins/tsed/TsEdPlugin';
import JsonSchemaValidationPlugin from '../src/plugins/jsonschema/JsonSchemaValidationPlugin';

export class UserOid extends ObjectIdEntity<UserOid> {
  static COLLECTION = 'users' as const;

  @Property('string')
  @Required()
  @MinLength(3)
  @MaxLength(50)
  name: string;
}
const URI = 'mongodb://localhost';

let client: MongoClient;
let db: Db;

async function dropCollections() {
  const collections = await db.collections();
  await Promise.all(collections.map(collection => collection.drop()));
}

function newUserRepository() {
  return new MongoRepository<UserOid>(UserOid, {
    db,
    plugins: [TsEdPlugin]
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

describe('TS.ED', () => {
  test('automatic schema generation', async () => {
    const schema = getJsonSchema(UserOid);
    console.log(schema)
  });

  test('TsEdPlugin initialization', async () => {
    let db = {} as Db;
    const repository = newUserRepository();

    const plugin = repository.plugins.find(x => x.PLUGIN_NAME === 'JsonSchemaValidationPlugin') as JsonSchemaValidationPlugin<UserOid>;

    expect(plugin.schema).toBeDefined();
    expect(plugin.schema).toHaveProperty('properties.name.maxLength');
  });

  test('insertOne validation error', async () => {
    const repository = newUserRepository();

    const user = new UserOid();
    user.name = 'g';

    let e;
    try {
      await repository.insertOne(user);
    } catch (error) {
      e = error;
    }

    expect(e).toBeDefined();
  });

  test('insertOne that passes', async () => {
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

})

