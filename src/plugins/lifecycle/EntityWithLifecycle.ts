import { Document, ObjectId } from 'bson';
import { ClonableEntity, IEntity } from '../../Entity';
import { JsonPatchOperation } from '../../MongoDbUtils';
import { Complex } from '../../Utils';

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

export type EntityMetadata<Identity = ObjectId> = Document & LifecycleMetadata & {
  version: number,
  origin?: OriginMetadata,
  ancestor: Identity,
};

export interface IEntityWithMetadata<Identity = ObjectId> {
  _meta: EntityMetadata<Identity>;
}

export class EntityWithLifecycle<
  T extends IEntity<Identity>,
  Identity = ObjectId,
  > extends ClonableEntity<T, Identity> implements IEntityWithMetadata<Identity> {
  _meta: EntityMetadata<Identity>;

  _alive = true as const;

  constructor(obj?: Partial<T>, {
    identityFactory = null,
  } = {} as {
    identityFactory: () => Identity, obj?: Partial<T>,
  }) {
    super(identityFactory, obj);
  }

  publish(options?: Document): JsonPatchOperation[] {
    return [
      ...EntityWithLifecycle.setEvent(LifecycleTimestamps.published, this, options),
      ...EntityWithLifecycle.setStatus(this, LifecycleStages.PUBLISHED),
    ];
  }

  archive(options?: Document): JsonPatchOperation[] {
    return [
      ...EntityWithLifecycle.setEvent(LifecycleTimestamps.archived, this, options),
      ...EntityWithLifecycle.setStatus(this, LifecycleStages.ARCHIVED),
    ];
  }

  unpublish(options?: Document): JsonPatchOperation[] {
    return [
      ...EntityWithLifecycle.setEvent(LifecycleTimestamps.updated, this, options),
      ...EntityWithLifecycle.setStatus(this, LifecycleStages.DRAFT),
    ];
  }

  unarchiveToDraft() {
    this.unpublish();
  }

  unarchiveToPublished() {
    this.publish();
  }

  static resetMetadata(document: Document) {
    document._meta = null;
    EntityWithLifecycle.initializeMetadata(document);
  }

  private static setStatus(
    document: Document,
    status: LifecycleStages,
  ): JsonPatchOperation[] {
    EntityWithLifecycle.initializeMetadata(document);
    document._meta.status = status;
    return [{
      op: 'replace',
      path: '/_meta/status',
      value: status,
    } as JsonPatchOperation];
  }

  static initializeMetadata(document: Document) {
    if (!document._meta) document._meta = {} as EntityMetadata;
    if (!document._meta.version) document._meta.version = 1;
    if (!document._meta.status) document._meta.status = LifecycleStages.DRAFT;
    if (!document._meta.events) document._meta.events = {} as LifecycleEvents;
  }

  static setEvent(
    event: LifecycleTimestamps,
    document: Document,
    options?: Document,
  ): JsonPatchOperation[] {
    EntityWithLifecycle.initializeMetadata(document);
    if (!document._meta.events[event]) document._meta.events[event] = {} as TimestampEvent;

    const ops = [] as JsonPatchOperation[];

    EntityWithLifecycle.setEventProperty(document, event, ops, 'timestamp', new Date());

    if (options && options.author) {
      EntityWithLifecycle.setEventProperty(document, event, ops, 'author', options.author);
    }
    if (options && options.comments) {
      EntityWithLifecycle.setEventProperty(document, event, ops, 'comments', options.comments);
    }
    if (options && options.reason) {
      EntityWithLifecycle.setEventProperty(document, event, ops, 'reason', options.reason);
    }

    return ops;
  }

  private static setEventProperty(
    document: Document,
    event: LifecycleTimestamps,
    ops: JsonPatchOperation[],
    property: string,
    value: Complex,
  ) {
    document._meta.events[event][property] = value;
    ops.push({
      op: 'replace',
      path: `_meta.events.${event}.${property}`,
      value,
    });
  }
}
