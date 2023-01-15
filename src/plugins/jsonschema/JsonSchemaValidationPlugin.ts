import { Document } from 'bson';
import Ajv, { ValidationError } from 'ajv';
import ajvbsontype from 'ajv-bsontype';
import IRepository from '../../IRepository';
import { IRepositoryPlugin } from '../../IRepositoryPlugin';
import { RepositoryPlugin } from '../../RepositoryPlugin';
import { Complex, LogLevel } from '../../Utils';

export type JsonSchemaValidationOptions = {
  ajv?: Ajv,
  schema?: object,
  logLevel?: LogLevel,
};

export default class JsonSchemaValidationPlugin<TEntity>
  extends RepositoryPlugin<TEntity>
  implements IRepositoryPlugin {
  PLUGIN_NAME = 'JsonSchemaValidationPlugin' as const;

  schema: object;

  ajv: Ajv;

  logLevel: LogLevel;

  constructor(
    repository: IRepository<TEntity>,
    options: Partial<JsonSchemaValidationOptions> = {},
  ) {
    super(repository, options);

    if (!options.schema && this.logLevel > LogLevel.Info && console) {
      // eslint-disable-next-line no-console
      console.warn('[mongobuble][JsonSchemaValidationPlugin] Schema was not specified. Consider'
        + 'passing a schema to validate operations or explictly disabling the plugin.');
    }

    this.schema = options.schema;
    this.ajv = options.ajv || new Ajv();
    this.logLevel = options.logLevel;

    // validates against bsonType clauses in JSON Schema
    ajvbsontype(this.ajv);
  }

  async onBeforeInsert(document: Document): Promise<void | Complex> {
    if (!this.schema || !this.ajv) return;

    const valid = this.ajv.validate(this.schema, document);
    if (!valid) {
      throw new ValidationError(this.ajv.errors);
    }
  }

  async onBeforeReplace(document: Document): Promise<void | Complex> {
    if (!this.schema || !this.ajv) return;

    const valid = this.ajv.validate(this.schema, document);
    if (!valid) {
      throw new ValidationError(this.ajv.errors);
    }
  }

  onBeforePatch: undefined;

  onAfterGet: undefined;

  onBeforeGet: undefined;

  onBeforeDelete: undefined;

  onAfterInsert: undefined;

  onAfterPatch: undefined;

  onAfterReplace: undefined;

  onAFterDelete: undefined;

  onBeforeList: undefined;

  onAfterList: undefined;
}
