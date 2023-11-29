import { Constructor, IRepositoryValidator } from '@mongobubble/core';
import { getJsonSchema } from '@tsed/schema';
import Ajv from 'ajv';
import type { Document } from 'bson';

export class TsEdValidatorClass implements IRepositoryValidator {
  ajv: Ajv;

  constructor(ajv?: Ajv) {
    this.ajv = ajv || new Ajv({
      coerceTypes: true,
      useDefaults: true,
    });
  }

  validate(document: Document, { schema, entityClass }: {
    schema?: object,
    entityClass?: Constructor,
  }): boolean {
    const theSchema = schema || getJsonSchema(entityClass);
    const validate = this.ajv.compile(theSchema);
    const valid = validate(document);
    if (!valid) {
      throw new Error(`Validation error: ${this.ajv.errorsText(validate.errors)}`);
    }
    return valid;
  }
}

// this allows modifying Ajv instance without requiring to intantiate the validator
const VALIDATOR = new TsEdValidatorClass();

export default VALIDATOR;
