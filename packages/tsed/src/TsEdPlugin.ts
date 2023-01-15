import { Document } from 'bson';
import { getJsonSchema } from '@tsed/schema';
import { IRepository, IRepositoryPlugin, RepositoryPlugin } from '@mongobubble/core';
import { JsonSchemaValidationPlugin } from '@mongobubble/json-schema';

const JSON_PLUGIN = 'JsonSchemaValidationPlugin';

export default class TsEdPlugin<TEntity>
  extends RepositoryPlugin<TEntity>
  implements IRepositoryPlugin {
  PLUGIN_NAME = 'TsEdPlugin' as const;

  constructor(
    repository: IRepository<TEntity>,
    options: Document,
  ) {
    super(repository, options);

    const schema = getJsonSchema(repository.EntityClass);

    const jsonSchemaPlugin = repository.plugins
      .find(p => p.PLUGIN_NAME === JSON_PLUGIN) as JsonSchemaValidationPlugin<TEntity>;

    options.schema = schema;
    if (jsonSchemaPlugin) {
      jsonSchemaPlugin.schema = schema;
    }
  }

  onBeforeInsert: undefined;

  onBeforePatch: undefined;

  onBeforeReplace: undefined;

  onBeforeDelete: undefined;

  onBeforeList: undefined;

  onBeforeGet: undefined;

  onAfterInsert: undefined;

  onAfterPatch: undefined;

  onAfterReplace: undefined;

  onAFterDelete: undefined;

  onAfterList: undefined;

  onAfterGet: undefined;
}
