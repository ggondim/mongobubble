import { TypeXOR } from 'ts-advanced-types';
import { ObjectId } from 'bson';
import { isEntity } from './Entity';

/**
 * @typedef {Relationship<EntityType, IdentityType = ObjectId> = TypeXOR<EntityType, IdentityType>}
 * @description A relationship is defined by an Entity object XOR its Identity.
 * @template EntityType Entity type.
 * @template [IdentityType=ObjectId] Entity identity type.
 */
type Relationship<EntityType, IdentityType = ObjectId> = TypeXOR<EntityType, IdentityType>;

export function relationshipToIdentity<EntityType, IdentityType = ObjectId>(
  relationship: Relationship<EntityType, IdentityType>,
): IdentityType {
  if (isEntity<IdentityType>(relationship)) return relationship._id;
  return relationship as IdentityType;
}

export default Relationship;
