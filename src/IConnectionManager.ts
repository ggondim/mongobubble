import { MongoClient } from 'mongodb';

export default interface IConnectionManager {
  getClient(name?: string): Promise<MongoClient>;
  dispose(): Promise<void>
  // eslint-disable-next-line semi
}
