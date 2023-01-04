import { MongoClient } from 'mongodb';

/**
 * Manages MongoDB connections
 * @export
 * @interface IConnectionManager
 */
export default interface IConnectionManager {
  getClient(name?: string): Promise<MongoClient>;
  dispose(): Promise<void>
  // eslint-disable-next-line semi
}
