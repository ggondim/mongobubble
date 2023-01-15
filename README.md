<h1 align="center">
  <br>
  🍃🫧 MongoBubble
  <br>
</h1>

<p align="center">A MongoDB framework for Node.js and TypeScript.</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/mongobubble" />
  <img src="https://img.shields.io/bundlephobia/min/mongobubble" />
  <img src="https://img.shields.io/github/last-commit/ggondim/mongobubble" />
</p>

<hr>

<p align="center">
  <a href="#">Basic usage</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="#">Installation</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="#">Advanced usage</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="#">API</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="#">Table of contents</a>
</p>

<hr>

MongoBubble is a simple framework to read and write to MongoDB databases, designed for use with TypeScript and without the need of explict schema modeling.

Instead, you can assure your entity properties are correctly typed during development just using your own TypeScript classes. Additionally, you can also specify JSON Schemas to validate your entity objects during runtime as well.

Actually _MongoBubble acts like a midway between the native MongoDB Driver and ODMs like Mongoose_.

Plus, it comes with everyday requirements, like versioning, lifecycle, patching and soft delete.

See more information in [Technical concepts](#Technical-concepts) section.

<hr>

## Features

<dl>
  <dt><strong>Entity & Repository classes compatible with MongoDB Driver</strong> 🍃</dt>
  <dd>Define your entity classes in TypeScript and use repository methods like the native driver's methods.</dd>

  <dt><strong>Schema validation with JSON Schema</strong> 🧩</dt>
  <dd>Define <a href="https://json-schema.org/">JSON schemas</a> for your classes, automatically generated from typings or handcrafted, with <a href="https://github.com/BoLaMN/ajv-bsontype"><code>bsontype</code></a> validation support.</dd>

  <dt><strong>Ts.ED decorators support</strong> 🎀</dt>
  <dd>Instead of defining schemas, use <a href="https://tsed.io/docs/model.html">Ts.ED Model decorators</a> to specify property constraints.</dd>

  <dt><strong>Document versioning</strong> 🔢</dt>
  <dd>Automatic versioning of documents, incremented in each write operation.</dd>

  <dt><strong>Document timestamps</strong> 🏷️</dt>
  <dd>Automatic saving of timestamps in main entity events, such as 'created', 'updated', etc., with optional authoring and comments information.</dd>

  <dt><strong>Patch operations with JSON Patch objects</strong> 📝</dt>
  <dd>Run patch operations with native MongoDB update object or with a <a href="https://jsonpatch.com/">JSON Patch</a> array.</dd>

  <dt><strong>Lifecycle management</strong> 🚥</dt>
  <dd>Easy lifecycle plugin to separate drafts from published objects and also for soft delete (a.k.a. archive).</dd>

  <dt><strong>Atlas Online Archive support</strong> 🪦</dt>
  <dd>Automatic connection shitching when accessing hot or <a href="https://www.mongodb.com/atlas/online-archive">Online Archive</a> data using <a href="https://www.mongodb.com/docs/atlas/online-archive/connect-to-online-archive/#connect-to-the-federated-database-instance-for-your-online-archive">federated connections</a>.</dd>

  <dt><strong>Easy extension with plugins</strong> 🔌</dt>
  <dd>Write your own plugins with interceptors hooks to run before or after repository operations.</dd>

  <dt><strong>Utilities</strong> 🎁</dt>
  <dd>Many other utilities like document branching/cloning, relationship modeling and external/federated identity modeling.</dd>
</dl>

<br><hr>

## TL;DR: basic usage
[![](https://img.shields.io/static/v1?label=Try%20it%20online%20on&message=RunKit&color=f55fa6)](https://npm.runkit.com/mongobubble)

The code below initializes a repository for the `User` entity with the default plugins enabled:

```javascript
class User extends EntityWithLifecycle<User> {
  static COLLECTION = 'users' as const;

  name: string;
}

const repository = new MongoBubble<User>(User, { db });

await repository.insertOne(user);
```
### Cleanest usage without default plugins

You can opt-out the default enabled plugins using the classes `ClonableEntity` and `MongoRepository` instead, alongside the `overrideDefaultPlugins` option:

```javascript
class User extends ClonableEntity<User> {
  static COLLECTION = 'users' as const;

  name: string;
}

const repository = new MongoRepository<User>(User, { db, overrideDefaultPlugins: [] });
```
See more usage topics in [usage](#usage) section.
<br><hr>

## Table of contents

<ul>
  <li>
    <details>
      <summary><a href="#Installation">Installation</a></summary>
      <ul>
        <li><a href="#Requirements">Requirements</a></li>
        <li><a href="#Installing">Installing</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details>
      <summary><a href="#Usage">Usage</a></summary>
      <ul>
        <li><a href="#TLDR">TL;DR - The most simple usage</a></li>
        <li><a href="#example">Modeling entity classes</a></li>
        <li><a href="#example">Repository initialization</a></li>
        <li><a href="#example">Basic repository methods</a></li>
        <li><a href="#example">Updating documents with JSON Patch</a></li>
        <li><a href="#example">Validating documents with JSON Schema</a></li>
        <li><a href="#example">Automatic LifecyclePlugin metadata</a></li>
        <li><a href="#example">LifecyclePlugin stages: draft, published and archived</a></li>
        <li><a href="#example">Configuring Atlas Online Archive connections</a></li>
        <li><a href="#example">Using community or custom plugins</a></li>
        <li><a href="#example">Utilities</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details>
      <summary><a href="#Extending">Extending</a></summary>
      <ul>
        <li><a href="#example">An example title</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details>
      <summary><a href="#Help">Help</a></summary>
      <ul>
        <li><a href="#FAQ">FAQ</a></li>
        <li><a href="#Support">Support</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details>
      <summary><a href="#API">API</a></summary>
      <ul>
        <li><a href="#example">An example title</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details>
      <summary><a href="#Tecnhical-concepts">Technical concepts</a></summary>
      <ul>
        <li><a href="#Motivation-and-design">Motivation and design</a></li>
        <li><a href="#Features">Features</a></li>
        <li><a href="#Related-projects">Related projects</a></li>
        <li><a href="#Similar-projects">Similar projects</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details>
      <summary><a href="#Contributing">Contributing</a></summary>
      <ul>
        <li><a href="#If-you-don-t-want-to-code">If you don't want to code</a></li>
        <li><a href="#If-you-want-to-code">If you want to code</a></li>
      </ul>
    </details>
  </li>
  <li>
    <details>
      <summary><a href="#Hall-of-fame">Hall of fame</a></summary>
      <ul>
        <li><a href="#who-is-using">Who is using</a></li>
        <li><a href="#Contributors">Contributors</a></li>
        <li><a href="#Backers">Backers</a></li>
        <li><a href="#Sponsors">Sponsors</a></li>
      </ul>
    </details>
  </li>
  <li><a href="#License">License</a></li>
</ul>

---

## Installation

### Requirements

MongoBubble was tested for the environments below. Even we believe it may works in older versions or other platforms, **it is not intended to**.

![](https://img.shields.io/static/v1?label=node&message=^15.x&color=brightgreen) ![](https://img.shields.io/static/v1?label=typescript&message=^4.9.x&color=blue) ![](https://img.shields.io/static/v1?label=javascript&message=^es2021&color=yellow) ![](https://img.shields.io/static/v1?label=os&message=any&color=blueviolet) ![](https://img.shields.io/static/v1?label=platforms&message=node&color=777)

<details>
  <summary><b>See tested environments</b></summary>

| Environment  |  Tested version  |
| ------------------- | ------------------- |
|  OS |  Ubuntu 20.04 |
|  Node.js |  18.12.1 |
|  Package Manager |  npm 9.2.0 |
|  Typescript |  4.9.4 |
|  Platforms |  Node.js |

</details>

### Installing

#### Via package manager

![](https://nodei.co/npm/mongobubble.png?downloads=true&downloadRank=true&stars=true)

```shell
$ npm install --save mongobubble
```
<details>
  <summary><b>See other options</b></summary>

#### Yarn

```shell
$ yarn add mongobubble
```

#### Unpkg

[https://unpkg.com/:mongobubble](https://unpkg.com/:mongobubble)

```javascript
<script src="https://unpkg.com/:mongobubble" />
```

</details>

### Module/language support

![](https://img.shields.io/static/v1?label=modules&message=CommonJS&color=yellow)
![](https://img.shields.io/static/v1?label=javascript&message=ECMA2021&color=yellow)

This means you:

* **May** use the module with `import` in typescript and with `import` or `require` in JavaScript (although it is recommended to use TypeScript).
* **Should** target TypeScript compiler to use `esModuleInterop: true`, `module: 'CommonJS'`, `moduleResolution: 'Node'` and `lib: ['ES2021']`.

<details>
  <summary><b>See JavaScript features used by this package and its versions</b></summary>

| Version  |  Features used  |
| -------- | --------------- |
| ES5 | all common features |
| ES6 | const, class, destructuring binding, default parameters, let, object short notation, arrow function syntax, template literal syntax |
| ES8 | async functions, trailing comma in arguments lists |
| ES9 | object spread property |

</details>

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Usage

  <details>
    <summary><a href="#Installation">Modeling entity classes</a></summary>
    <ul>
      <li><a href="#Requirements">Identity different than ObjectId</a></li>
      <li><a href="#Installing">Entity with metadata (lifecycle, versioning, timestamps)</a></li>
      <li><a href="#Installing">The `COLLECTION` property</a></li>
    </ul>
  </details>

  <details>
    <summary><a href="#Installation">Repository initialization</a></summary>
    <ul>
      <li><a href="#Requirements">Collection name</a></li>
      <li><a href="#Installing">Using a `MongoClient` instance instead a `Db` instance</a></li>
      <li><a href="#Installing">Default plugins</a></li>
      <li><a href="#Installing">Supressing warnings and logging</a></li>
    </ul>
  </details>

  <details>
    <summary><a href="#Installation">Basic repository methods</a></summary>
    <ul>
      <li><a href="#Requirements">insertOne</a></li>
      <li><a href="#Requirements">insertMany</a></li>
      <li><a href="#Requirements">get</a></li>
      <li><a href="#Requirements">list</a></li>
      <li><a href="#Requirements">query</a></li>
      <li><a href="#Requirements">patchOne</a></li>
      <li><a href="#Requirements">patchMany</a></li>
      <li><a href="#Requirements">replaceOne</a></li>
      <li><a href="#Requirements">deleteOneById</a></li>
      <li><a href="#Requirements">deleteOne</a></li>
    </ul>
  </details>

  <details>
    <summary><a href="#Installation">Updating documents with JSON Patch</a></summary>
  </details>

  <details>
    <summary><a href="#Installation">Validating documents with JSON Schema</a></summary>
    <ul>
      <li><a href="#Requirements">Using a custom AJV instance</a></li>
      <li><a href="#Requirements">Using `bsontype` validation rules</a></li>
    </ul>
  </details>

  <details>
    <summary><a href="#Installation">Automatic LifecyclePlugin metadata</a></summary>
    <ul>
      <li><a href="#Requirements">Version increment</a></li>
      <li><a href="#Requirements">Events timestamps</a></li>
      <li><a href="#Requirements">Optional information of authorship and comments/reason</a></li>
    </ul>
  </details>

  <details>
    <summary><a href="#Installation">LifecyclePlugin stages: draft, published and archived</a></summary>
    <ul>
      <li><a href="#Requirements">`list`, `listAll`, `listDrafts` and `listArchive`</a></li>
      <li><a href="#Requirements">Controlling entity lifecycle with methods</a></li>
    </ul>
  </details>

  <details>
    <summary><a href="#Installation">Configuring Atlas Online Archive connections</a></summary>
  </details>

  <details>
    <summary><a href="#Installation">Using community or custom plugins</a></summary>
    <ul>
      <li><a href="#Requirements">Collection name</a></li>
    </ul>
  </details>

  <details>
    <summary><a href="#Installation">Utilities</a></summary>
    <ul>
      <li><a href="#Requirements">Document branching/cloning</a></li>
      <li><a href="#Requirements">Relationship modeling</a></li>
      <li><a href="#Requirements">External/federated identity modeling</a></li>
    </ul>
  </details>

<br/>

### ⭐ Modeling entity classes

To use a class as an entity type, extend the `ObjectIdEntity` class.

```javascript
import { ObjectIdEntity } from 'mongobubble';

class User extends ObjectIdEntity<User> {

}
```

This is mandatory because MongoBubble needs to ensure the entity class:
* has an `_id` property
* is instantiable from another entity object (MongoBubble read methods returns entity instances instead plain objects).

#### Identity different than ObjectId

If your entity has an identity with a different type than `ObjectId`, you can use the `ClonableEntity` class instead:


class User extends ObjectIdEntity<User> {

}

#### Entity with metadata (lifecycle, versioning, timestamps)

If your you want to use MongoBubble with its LifecyclePlugin, use the `EntityWithLifecycle` class instead:

```javascript
import { EntityWithLifecycle } from 'mongobubble';

class User extends EntityWithLifecycle<User> {

}

// also, you can specify another identity type rather than ObjectId:
class CustomUser extends EntityWithLifecycle<User, number> {

}
```

#### The `COLLECTION` property

To store the entity collection name inside its own class, use a static property `COLLECTION` as `const`:

```javascript
class User extends ObjectIdEntity<User> {

  static COLLECTION = 'users' as const;

}
```

This way MongoBubble will infer the collection name from this property and won't need a `collectionName` property.

### ⭐ Repository initialization

The default repository initialization is the following:

```javascript
import { MongoBubble } from 'mongobubble';

const repository = new MongoBubble<User>(User, { db });
```

This means that the repository:
* will use a collection name declared in a static const property `COLLECTION`
* will type function arguments and results with `User` entity class
* will return `User` instances in read operations, such as `list` and `get`
* will use a `Db` instance specified with `db` option
* will use MongoBubble default plugins

> 💡 Note that you need to pass the `User` class both as a type and as a constructor, because MongoBubble needs both to type variables and to create new instances of `User`. This is also why `User` need to extend `ClonableEntity` classes (`ObjectIdEntity` or `EntityWithLifecycle`).

#### Collection name

By default, MongoBubble try to infer the collection name from a static const property named `COLLECTION`.

Alternatively, you can pass a `collectionName` option:

```javascript
const repository = new MongoBubble<User>(User, { db, collectionName: 'users' });
```

#### Using a `MongoClient` instance instead a `Db` instance

By default, MongoBubble need an instance of `Db`.

Alternatively, you can specify a `client` option, but the `db` option still is required as a string:

```javascript
const repository = new MongoBubble<User>(User, { client: mongoClient, db: 'myDatabase' });
```

#### Default plugins

By default, the `MongoBubble` class uses the JsonSchemaValidationPlugin and LifecyclePlugin.

Alternatively, `MongoReposity` class just uses the JsonSchemaValidationPlugin by default.

You can override the default plugins using the `overrideDefaultPlugins` option:

```javascript
const repository = new MongoBubble<User>(User, { db, overrideDefaultPlugins: ['JsonSchemaValidationPlugin'] });
```
#### Supressing warnings and logging

Some things that could lead to unexpected behaviors during runtime are warned inside MongoBubble and its plugins. Also, other community plugins can use `console` to log information and warnings.

To control the log level MongoBubble and plugins will use, specify a `logLevel` option:

```javascript
import { LogLevel } from 'mongobubble';

const repository = new MongoBubble<User>(User, { db, logLevel: LogLevel.Nothing });
```

### ⭐ Basic repository methods

The basic repository methods for CRUD operations are:

(click to see method documentation and examples)

* [insertOne](): inserts a single document
* [insertMany](): inserts multiple documents
* [get](): retrieve a document by its identity
* [list](): list documents given a specified aggregation pipeline
* [query](): query the collection given a specified aggregation pipeline, but returning something different than a list of entity objects
* [patchOne](): patches a single document, either with a MongoDB update document or with a JSON Patch document
* [patchMany](): patches multiple documents at once, using the same overloads of `patchOne`
* [replaceOne](): replaces entirely a single document
* [deleteOneById](): removes a single document by its identity
* [deleteOne](): removes a single document given a specified query

### ⭐ Updating documents with JSON Patch

[JSON Patch](https://jsonpatch.com/) is a format for describing changes to a JSON document. It can be used to avoid replacing a whole document when only a part has changed. Its also useful to use in combination with HTTP PATCH methods.

MongoBubble supports JSON Patch documents as the second argument for the `patchOne` or `patchMany` methods:

```javascript
import { JsonPatchOperation } from 'mongobubble';

const userPatch = [{
  op: 'replace',
  path: '/name',
  value: 'Gondim',
}] as JsonPatchOperation[];

await repository.patchOne({ _id: user._id }, userPatch);
```

MongoBubble uses [jsonpatch-to-mongodb](https://github.com/mongodb-js/jsonpatch-to-mongodb) under the hood. So be aware of [its limitations](https://github.com/mongodb-js/jsonpatch-to-mongodb/blob/master/index.js).

### ⭐ Validating documents with JSON Schema

You can define JSON Schema for your entities either using [JSON Schema](https://ajv.js.org/guide/schema-language.html#json-schema) (drafts 04, 06, 07, 2019-09 and 2020-12) or [JSON Type Definition](https://ajv.js.org/guide/schema-language.html#json-type-definition).

When using MongoBubble with JsonSchemaValidationPlugin enabled, you can pass a `schema` option during repository initialization:

```typescript
const repository = new MongoBubble<User>(User, { db, schema: userSchema });
```

>⚠️ This is not equivalent to [specify validation rules for MongoDB collections inside database](https://www.mongodb.com/docs/manual/core/schema-validation/specify-json-schema/). The schema validation with MongoBubble occurs during application runtime, not during database operations. This is not supported because MongoDB native schema validation only supports draft-04 of JSON Schema and it has many [extensions and omissions](https://www.mongodb.com/docs/manual/reference/operator/query/jsonSchema/#std-label-jsonSchema-extension).

#### Using `bsontype` validation rules

You can specify a [`bsontype`](https://www.mongodb.com/docs/manual/reference/operator/query/type/#std-label-document-type-available-types) rule for your schema properties to validate the BSON type of your entity properties.

```typescript
const userSchema = {
   required: [ "name", "age" ],
   properties: {
      // ...
      age: {
         bsonType: "int",
         description: "must be an integer and is required"
      },
   }
}

const repository = new MongoBubble<User>(User, { db, schema: userSchema });
```

See [all available BSON type aliases](https://www.mongodb.com/docs/manual/reference/operator/query/type/#std-label-document-type-available-types).

#### Using a custom AJV instance

Under the hood, MongoBubble uses [AJV](https://ajv.js.org/) to validate documents against schemas. You can also specify your own `Ajv` instance with the `ajv` option:

```typescript
const repository = new MongoBubble<User>(User, { db, schema: userSchema, ajv: ajvInstance });
```

>💡 Mind the JsonSchemaValidationPlugin also uses [ajv-bsontype](https://www.npmjs.com/package/ajv-bsontype) under the hood so it will inject this AJV plugin to the `ajv` instance specified in options.

### ⭐ Automatic LifecyclePlugin metadata

When using `EntityWithLifecycle` class and MongoBubble with LifecyclePlugin enabled, the repository will perform automatic metadata writing, such as:

#### Version increment

Automatic version increment is a MongoBubble feature useful to track how many times a document was altered and also for creating document hashes from identities together with versions. For example, you can use a document _id alongside its version as an ETag HTTP header.

At the first insert operation of every document, the repository will initialize an entity property `_meta.version` with `1`.

Later, when every update operation occurs, the repository will increment this property by `1`.

This is performed both against patch and replace operations, although using the replace operation is more expensive to the repository.

> 💡 You can't increment versions by yourself. Patch operations will always overwrite `{ $inc: { '_meta.version' } }` and replace operations will retrieve the original document version stored in database before the operation occurs, even if you specify a replacement document with a version different than the database version. This happens to ensure database version consistency.

#### Events timestamps

`EntityWithLifecycle` comes with a metadata property named `_meta.events`.

Each time you write a document using MongoBubble (insert, patch or replace), the repository will save a timestamp accordingly to the event.

The lifecycle events are:

* `created`: set once when document is inserted
* `updated`: set each time the document is updated (only the last time, not every one)
* `published`: set when the lifecycle stage is set to "Published" (also is the last time the document was published and will be preserved even the document is converted to a draft again)
* `archived`: the same as `published` but now for `Archived` stage.

This is an example of a document with all the timestamps set:

```javascript
{
  // ...
  _meta: {
    version: 4,
    events: {
      created: {
        timestamp: IsoDate("")
      },
      updated: {
        timestamp: IsoDate("")
      },
      published: {
        timestamp: IsoDate("")
      },
      archived: {
        timestamp: IsoDate("")
      }
    }
  }
}
```

#### Optional information of authorship and comments/reason

During a write operation, you may specify optional metadata information to be stored in metadata events.

The three additional information are:

* `author`: a string containing information of the author identity that performed the operation, like an user e-mail.
* `comments`: a string with comments about the operation. Useful to store user information about what changed, just as a commit message.
* `reason`: some techinical or standardized information about the cause of the operation, like "Imported from external file", "Automatic publishing approval" or "Archived by user".

You can specify any or none of above using the second argument `options` of insert, patch and replace methods:

```typescript
repository.insertOne(user, {
  author: 'gustavospgondim@gmail.com'
})
```

#### LifecyclePlugin stages: draft, published and archived

`EntityWithLifecycle` also comes with a property named `_meta.status`.

This property is intended to express a very basic lifecycle of a document, from its creation, through its publishing and then until its archiving. These three stages are expressed in `LifecycleStages` enum.

It affects both list methods of `MongoBubble` class and `_meta.events` timestamp recording.

By default, every entity that extends the `EntityWithLifecycle` class is created with `_meta.status: "DRAFT"`.

#### `list`, `listAll`, `listDrafts` and `listArchive`

`MongoBubble` has four methods that return a different set of entity documents:

* `list`: filter only the documents with stage "PUBLISHED"
* `listAll`: return all the documents, without any lifecycle filter
* `listDrafts`: filter documents with stage "DRAFT"
* `listArchive`: filter documents with stage "ARCHIVED"

#### Controlling entity lifecycle with methods

The best semantic way to change lifecycle stages is with methods implemented by `EntityWithLifecycle` class:

* `publish()`: set the document lifecycle to "PUBLISHED"
* `archive()`: set the document lifecycle to "ARCHIVED", equivalent to a *soft delete*
* `unpublish()`: set the document lifecycle to "DRAFT"
* `unarchiveToPublished()`: is an alias to `publish()`
* `unarchiveToDraft()`: is an alias to `unpublish()`

> The methods above don't perform any update operation in database. You need to call a patch or a replace operation to save the new lifecycle stage.

All these methods mutate the document with new stage values and also return a `JsonPatchOperation[]` result, so you can use the document itself as a replacement or the method result as a patch document in repository:

```typescript
const { _id } = user;
const patch = user.publish();

await repository.patchOne({ _id }, patch);
// now user._meta.status is "PUBLISHED" in database

user.archive();

await repository.replaceOne(user);
// now user._meta.status is "ARCHIVED" in database
```

### ⭐ Configuring Atlas Online Archive connections

MongoDB Atlas' Online Archive is a hosted service that automatically archive data by custom rules, while keeping the archived data acessible. This is useful to optimize storage costs and performance and also to implement soft delete.

If you are not familiar about what is Online Archive, how does it work or how to implement it, read more here:
* [What is](https://www.mongodb.com/atlas/online-archive)
* [How does it work](https://www.mongodb.com/docs/atlas/online-archive/manage-online-archive/?_ga=2.230622556.1782409509.1672981298-922776856.1672981298#how-service-archives-data)
* [A guide how to implement it](https://www.mongodb.com/developer/products/atlas/manage-data-at-scale-with-online-archive/)

MongoBubble helps you easily access hot and cold data by automatically switching database connections depending the list method you call.

This is possible through the `OnlineArchiveManager` class.

#### Using `OnlineArchiveManager` class

First, you should create an instance of the class using two arguments: `uris` and `connections`.

The `uris` argument should be an object with three properties:

* `default`: the usual MongoDB connection URI you use to connect to your cluster
* `archive`: the Online Archive exclusive connection URI
* `federated`: the Federated connection that queries both hot and archive databases

The `connections` argument should be any object reference that could be mutated to store the three connection instances as above, like a global variable for reuse.

```typescript
import OnlineArchiveManager from 'mongobubble';

const manager = new OnlineArchiveManager({
  default: '...',
  archive: '...',
  federated: '...',
}, {});
```

Now you can use this manager instance with MongoBubble repositories using the `manager` class:

```typescript
const repository = new MongoBubble<User>(User, { db: 'myDatabase', manager });
```

#### Querying archive data

When passing the option `manager` to the repository constructor, the repository will use the `federated` connection when the methods `listArchive` and `listAll` methods are called.

Otherwise, all the other methods are called with the `default` connection.

> 💡 The `listAll` method uses the federated connection because Atlas takes some time to check archive rules and to move documents from a storage to another, then 'ARCHIVED' objects could be either in hot or cold storage. Be aware that using this method is a little worse for query performance.

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Extending

### Writing plugins

### Community plugins

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Help

### FAQ

<details>
  <summary><b>1. First question?</b></summary>

Answer here

</details>

### Support

![](https://img.shields.io/github/issues/ggondim/mongobubble)

If you need help or have a problem with this project and you not found you problem in FAQ above, [start an issue](https://github.com/ggondim/mongobubble/issues).

> We will not provide a SLA to your issue, so, don't expect it to be answered in a short time.

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## API

### `ClassOrModule.js` _class|module_

#### Members

<details>
  <summary>
    <b>
      <code>memberName</code>
      <i>type?_=<code>defaultValue</code></i>
    </b>
  </summary>

> Description what it is

</details>

#### Properties

<details>
  <summary>
    <b>
      <code>propertyName</code>
      <i>type</i>
    </b>
  </summary>

> Description of what it is

</details>

#### Methods

<details>
  <summary>
    <b>
      <code>methodName()</code>
      <i>function(arg1, optional?):ReturnType</i>
    </b>
  </summary>



> Description what it does

**Arguments**

| Argument | Type | Required | Default | Description |
| - | - | - | - | - |
| arg1 | `Type` | true | `default` | Description of argument |

**Returns**

`AzureFunctionCascade` the current instance of AzureFunctionCascade.

**Callbacks**

##### `arg1Callback` _async function (context, STOP_SIGNAL?):any_

| Argument | Type | Required | Default | Description |
| - | - | - | - | - |
| arg1 | `Type` | true | `default` | Description of argument |

Returns: description of callback return.

</details>

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Technical concepts

### Motivation and design

MongoBubble was inspired from MongoDB Driver itself. Actually it is a wrapper to the main driver's CRUD methods.

Some ODMs, like Mongoose, demands you explicitly declares a schema. MongoBubble was designed for TypeScript-first usage, so you don't need to declare schemas (but you can if you want to!).

Also, the need of object versioning and lifecycle is a major demand on almost all enterprise projects. Just as hot/cold storages for soft deletion (like Atlas Online Archive implemetation).

### Features

Beyond the features previous listed, MongoBubble also have:

* Relationship modeling types
* Other metadata typings, such as external identity (federated)

### Related projects

* [MongoDB Node Driver](https://www.mongodb.com/docs/drivers/node/current/)
* [Ajv](https://ajv.js.org/)
* [jsonpatch-to-mongodb](https://github.com/mongodb-js/jsonpatch-to-mongodb)
* [ajv-bsontype](https://www.npmjs.com/package/ajv-bsontype)

### Similar projects

* [Mongoose](https://mongoosejs.com/)

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Contributing

### If you don't want to code

Help us spreading the word or consider making a donation.

#### Star the project

![](https://img.shields.io/github/stars/ggondim/mongobubble?style=social)

#### Tweet it

![](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fgithub.com%2Fggondim%2Fmongobubble)

#### Donate

![](https://c5.patreon.com/external/logo/become_a_patron_button.png)

![](https://camo.githubusercontent.com/b8efed595794b7c415163a48f4e4a07771b20abe/68747470733a2f2f7777772e6275796d6561636f666665652e636f6d2f6173736574732f696d672f637573746f6d5f696d616765732f707572706c655f696d672e706e67)

<img src="https://opencollective.com/webpack/donate/button@2x.png?color=blue" width=250 />

<br/>

#### Add your company name to the [Who is using](#Who-is-using) secion

Make a pull request or start an issue to add your company's name.

### If you want to code

![](https://img.shields.io/static/v1?label=code%20style&message=eslint/airbnb&color=orange)

#### Code of conduct

![](https://img.shields.io/static/v1?label=Code%20of%20conduct&message=Contributor%20Covenant&color=informational)

We follow [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/code_of_conduct.md). If you want to contribute to this project, you must accept and follow it.

#### SemVer

![](https://img.shields.io/static/v1?label=semver&message=2.0.0&color=informational)

This project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

#### Roadmap

If you are not solving an issue or fixing a bug, you can help developing the roadmap below.

<details>
  <summary>
    <b>See the roadmap</b>
  </summary>

* [ ] EJSON Plugin
* [ ] Automatic relationship injection (relationship population with $lookup)
* [ ] Develop plugin tests
* [ ] Improve documentation
* [ ] Write examples
* [ ] Clear "TODO" items

</details>


<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## Hall of fame

### Who is using

* [Company]()

### Contributors

[![](https://sourcerer.io/fame/$USER/$OWNER/$REPO/images/0)](https://sourcerer.io/fame/ggondim/${OWNER}/mongobubble/links/0)

### Backers

<object type="image/svg+xml" data="https://opencollective.com/collective/tiers/backers.svg?avatarHeight=36&width=600"></object>

### Sponsors

<object type="image/svg+xml" data="https://opencollective.com/collective/tiers/Sponsors.svg?avatarHeight=36&width=600"></object>

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

## License

![](https://img.shields.io/github/license/ggondim/mongobubble)

Licensed under the [MIT License](LICENSE.md).

<br/>

<p align="right"><a href="#Table-of-contents">↟ Back to top</a></p>

---

