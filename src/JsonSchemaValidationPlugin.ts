import { Document } from 'bson';
import Ajv, { ValidationError } from 'ajv';
import { IRepositoryPlugin, RepositoryPlugin } from './RepositoryPlugin';

export type JsonSchemaValidationOptions = {
  ajv?: Ajv,
  schema?: object,
};

export default class JsonSchemaValidationPlugin
  extends RepositoryPlugin
  implements IRepositoryPlugin {
  PLUGIN_NAME: 'JsonSchemaValidationPlugin';

  schema: object;

  ajv: Ajv;

  constructor(options: Partial<JsonSchemaValidationOptions> = {}) {
    super(options);

    this.schema = options.schema;

    if (!this.schema) {
      // TODO: warn schema is not specified
    }

    this.ajv = options.ajv || new Ajv();
  }

  async onBeforeInsert(document: Document): Promise<void> {
    if (!this.schema || !this.ajv) return;

    const valid = this.ajv.validate(this.schema, document);
    if (!valid) {
      throw new ValidationError(this.ajv.errors);
    }
  }

  onBeforePatch: undefined;

  async onBeforeReplace(document: Document): Promise<void> {
    if (!this.schema || !this.ajv) return;

    const valid = this.ajv.validate(this.schema, document);
    if (!valid) {
      throw new ValidationError(this.ajv.errors);
    }
  }

  onBeforeDelete: undefined;

  onAfterInsert: undefined;

  onAfterPatch: undefined;

  onAfterReplace: undefined;

  onAFterDelete: undefined;
}
