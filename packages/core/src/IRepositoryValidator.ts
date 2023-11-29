import { Document } from 'bson';

export type Constructor<T = unknown> = { new(...args: unknown[]): T };

interface IRepositoryValidator {
  validate(document: Document, { schema, entityClass }: {
    schema?: object,
    entityClass?: Constructor,
  }): boolean;
}

export default IRepositoryValidator;

export class ValidationError extends Error {
  original?: Error;

  errors?: ValidationError[];

  schema: object;

  document: Document;

  constructor(
    schema: object | Constructor,
    document: Document,
    original?: Error,
    errors?: ValidationError[],
  ) {
    super('Validation error');
    this.schema = schema;
    this.document = document;
    this.original = original;
    this.errors = errors;
  }
}
