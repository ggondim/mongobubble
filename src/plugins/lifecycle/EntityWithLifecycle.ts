import { Document, ObjectId } from 'bson';
import { ClonableEntity, IEntity } from '../../Entity';
import { JsonPatchOperation } from '../../MongoDbUtils';

export enum LifecycleTimestamps {
  created = 'created',
  updated = 'updated',
  published = 'published',
  archived = 'archived',
}

export enum LifecycleStages {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export type TimestampEventDetails = {
  author?: string,
  comments?: string,
  reason?: string,
};

export type TimestampEvent = {
  timestamp: Date
} & TimestampEventDetails;

export type LifecycleEvents = {
  [k in LifecycleTimestamps]?: TimestampEvent;
};

export type LifecycleMetadata = {
  events: LifecycleEvents,
  status: LifecycleStages,
};

export type OriginMetadata = {
  realm: string,
  type: string,
};

export type EntityMetadata = Document & LifecycleMetadata & {
  version: number,
  origin?: OriginMetadata
};

export interface IEntityWithMetadata {
  _meta: EntityMetadata;
}

export class EntityWithLifecycle<
  T extends IEntity<Identity>,
  Identity = ObjectId,
> extends ClonableEntity<T, Identity> implements IEntityWithMetadata {
  _meta: EntityMetadata;

  constructor(obj?: Partial<T>, {
    identityFactory = null,
  } = {} as {
    identityFactory: () => Identity, obj?: Partial<T>,
  }) {
    super(identityFactory, obj);
  }

  publish(): JsonPatchOperation[] {
    EntityWithLifecycle.initializeMetadata(this);
    this._meta.status = LifecycleStages.PUBLISHED;
    return [{
      op: 'replace',
      path: '/_meta/status',
      value: LifecycleStages.PUBLISHED,
    } as JsonPatchOperation];
  }

  archive(): JsonPatchOperation[] {
    EntityWithLifecycle.initializeMetadata(this);
    this._meta.status = LifecycleStages.ARCHIVED;
    return [{
      op: 'replace',
      path: '/_meta/status',
      value: LifecycleStages.ARCHIVED,
    } as JsonPatchOperation];
  }

  unpublish(): JsonPatchOperation[] {
    EntityWithLifecycle.initializeMetadata(this);
    this._meta.status = LifecycleStages.DRAFT;
    return [{
      op: 'replace',
      path: '/_meta/status',
      value: LifecycleStages.DRAFT,
    } as JsonPatchOperation];
  }

  unarchiveToDraft() {
    this.unpublish();
  }

  unarchiveToPublished() {
    this.publish();
  }

  static initializeMetadata(document: Document) {
    if (!document._meta) document._meta = {} as EntityMetadata;
    if (!document._meta.version) document._meta.version = 1;
    if (!document._meta.status) document._meta.status = LifecycleStages.DRAFT;
    if (!document._meta.events) document._meta.events = {} as LifecycleEvents;
    if (!document._meta.events.created) document._meta.events.created = {} as TimestampEvent;
    if (!document._meta.events.created.timestamp) {
      document._meta.events.created.timestamp = new Date();
    }
  }
}
