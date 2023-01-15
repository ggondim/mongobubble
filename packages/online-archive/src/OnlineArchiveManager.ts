import { MongoClient } from 'mongodb';
import { IConnectionManager } from '@mongobubble/core';

export enum OnlineArchiveConnectionType {
  Default = 'default',
  Federated = 'federated',
}

export type OnlineArchiveUris = {
  [connectionType in OnlineArchiveConnectionType]?: string;
};

export type OnlineArchiveConnections = {
  [connectionType in OnlineArchiveConnectionType]?: MongoClient;
};

export default class OnlineArchiveManager implements IConnectionManager {
  connections: OnlineArchiveConnections;

  uris: OnlineArchiveUris;

  constructor(uris: OnlineArchiveUris, connections: OnlineArchiveConnections) {
    this.connections = connections;
    this.uris = uris;
  }

  private async connect(specific?: OnlineArchiveConnectionType) {
    const uri = this.uris[specific || OnlineArchiveConnectionType.Default];
    const client = await MongoClient.connect(uri);
    this.connections[specific || OnlineArchiveConnectionType.Default] = client;
    return client;
  }

  async getClient(specific?: OnlineArchiveConnectionType): Promise<MongoClient> {
    let client = this.connections[specific || OnlineArchiveConnectionType.Default];
    if (!client) client = await this.connect(specific);
    return client;
  }

  async dispose(): Promise<void> {
    const promises = [];
    if (this.connections.default) promises.push(this.connections.default.close());
    if (this.connections.federated) promises.push(this.connections.federated.close());
    await Promise.all(promises);
  }
}
