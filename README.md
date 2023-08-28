<h1 align="center">
  <br>
  🍃🫧 <a href="https://mongobubble.com/">MongoBubble</a>
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
  <a href="https://mongobubble.com/docs/guides/getting-started">Getting started</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://mongobubble.com/#features">Features</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://mongobubble.com/docs/introduction/">Docs</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://mongobubble.com/docs/about/contributing/">Contributing</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://discord.gg/8tHgqen7Fk">Discord</a>
</p>

<hr>

MongoBubble is the next-generation framework for reading and writing to MongoDB databases.

With an agnostic design philosophy, you can use MongoBubble wihtout any schema modeling, just for a simple repository implementation.

On the other hand, you can use MongoBubble to build a full featured application, with modern schema modeling, validation, common enterprise patterns and more.

Actually, MongoBubble acts like a midway between a proprietary ODM (like Mongoose) and a simple MongoDB driver.

It was inspired from the official MongoDB Node.js Driver plus the latest technologies like JSON Schema, HTTP PATCH and JSON Patch, TypeScript and the latest JavaScript features.

<hr>

<!-- ## Features

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
  <dd>Automatic saving of timestamps in main entity events, such as <code>created</code>, <code>updated</code>, etc., with optional authoring and comments information.</dd>

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
[![](https://img.shields.io/static/v1?label=Try%20it%20online%20on&message=RunKit&color=f55fa6)](https://npm.runkit.com/mongobubble) -->


## Documentation

* [Website](https://mongobubble.com/)
* [Introduction](https://mongobubble.com/docs/introduction/)
* [Getting started](https://mongobubble.com/docs/guides/getting-started/)
* [Migrating from Mongoose](https://mongobubble.com/docs/guides/mongoose/)
* [Modeling](https://mongobubble.com/docs/modeling/class/)
* [Repository](https://mongobubble.com/docs/repository/constructor/)
* [Lifecycle and metadata](https://mongobubble.com/docs/lifecycle/introduction/)
* [Plugins and utilities](https://mongobubble.com/docs/plugins/how-to-use/)


## Help

![](https://img.shields.io/github/issues/ggondim/mongobubble)

If you need help or have a problem with this project <!--and you did not find you problem in FAQ above, -->[start an issue](https://github.com/ggondim/mongobubble/issues).

> _We don't provide a SLA to your issue, so, don't expect it to be answered in a short time._

<br/>

## Contributing

* [Spread the word](https://mongobubble.com/docs/about/contributing/#spread-the-word)
* [Consider making a donation](https://mongobubble.com/docs/about/contributing/#donations)
* [Help improving code and documentation](https://mongobubble.com/docs/about/contributing/#code-and-documentation)

<br/>

## Roadmap

[MongoBubble Public Roadmap](https://github.com/users/ggondim/projects/3)

<!-- * [ ] Declare decorators in EntityWithMetadata class
* [ ] Create a MultiConnectionManager to help with many database connections
* [ ] BsonTypeConversionPlugin to automatically convert JavaScript types to specific BsonTypes infered by decorators and using EJSON
* [ ] Generate API docs automatically
* [ ] A static github.io website with documentation
* [ ] Develop plugin tests
* [ ] Improve documentation
* [ ] Write examples
* [ ] Clear "TODO" items -->

<br/>

## Hall of fame

### Who is using

Be the first to put your company name here!

### Contributors

[![](https://sourcerer.io/fame/ggondim/mongobubble/images/0)](https://sourcerer.io/fame/ggondim/mongobubble/links/0)

### Backers

<object type="image/svg+xml" data="https://opencollective.com/collective/tiers/backers.svg?avatarHeight=36&width=600"></object>

### Sponsors

<object type="image/svg+xml" data="https://opencollective.com/collective/tiers/Sponsors.svg?avatarHeight=36&width=600"></object>

<br/>

## License

![](https://img.shields.io/github/license/ggondim/mongobubble)

© 2023 MongoBubble. Code licensed under the [MIT License](LICENSE.md). Documentation licensed under CC BY-NC-SA 4.0.

<br/>

