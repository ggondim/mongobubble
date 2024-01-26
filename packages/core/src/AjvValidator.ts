import type { Document } from 'bson';
import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';
import IRepositoryValidator, { Constructor } from './IRepositoryValidator';

export class AjvValidatorClass implements IRepositoryValidator {
  ajv: Ajv;

  constructor(ajv?: Ajv) {
    this.ajv = ajv || new Ajv({
      coerceTypes: true,
      useDefaults: true,
    });
    ajvKeywords(this.ajv);
  }

  validate(document: Document, { schema }: {
    schema?: object,
    entityClass?: Constructor,
  }): boolean {
    const validate = this.ajv.compile(schema);
    const valid = validate(document);
    if (!valid) {
      throw new Error(`Validation error: ${this.ajv.errorsText(validate.errors)}`);
    }
    return valid;
  }
}

// this allows modifying Ajv instance without requiring to intantiate the validator
const VALIDATOR = new AjvValidatorClass();

export default VALIDATOR;
