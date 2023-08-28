import { describe, expect, test } from '@jest/globals';
import { ObjectId } from 'bson';
import { isEntity } from '../src/Entity';
import { UserClonable, UserOid } from './stubs';



describe('Entity', () => {
  test('ObjectIdEntity empty constructor', () => {
    const user = new UserOid();
    user.name = 'Gustavo';

    expect(user._id).toBeUndefined();
  });

  test('ObjectIdEntity object constructor', () => {
    const userObj = {
      _id: new ObjectId(),
      name: 'Gustavo',
    };
    const user = new UserOid(userObj);

    expect(user._id.toHexString()).toBe(userObj._id.toHexString());
    expect(user.name).toBe(userObj.name);
  });

  test('ClonableEntity empty constructor, custom identity', () => {
    const user = new UserClonable();
    user.name = 'Gustavo';

    expect(user._id).toBe('IDENTITY');
  });

  test('ClonableEntity object constructor, custom identity', () => {
    const userObj = {
      _id: 'IDENTI2',
      name: 'Gustavo',
    };
    const user = new UserClonable(userObj);

    expect(user._id).toBe(userObj._id);
    expect(user.name).toBe(userObj.name);
  });

  test.skip('isEntity', () => {
    const userOid = new UserOid();
    const userClonable = new UserClonable();

    const isUserOidEntity = isEntity(userOid);
    const isUserClonableEntity = isEntity(userClonable);

    expect(isUserClonableEntity).toBeTruthy();
    expect(isUserOidEntity).toBeTruthy();
  });
})
