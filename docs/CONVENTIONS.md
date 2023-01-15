# Conventions

**These conventions must be used in every change made to this repository**.

Conventions are classified in different _types_ which may be extended or overrided in other project templates.

<details>
  <summary>Conventions types</summary>

  | Type | Usage |
  | --- | --- |
  | _Folders_ | Applies to every folder inside project root folder. |
  | _Files_ | Applies to every file inside this project except configuration files that require another format. |
  | _Commits_ | Applies to every commit made within this repository. |
  | _Releases_ | Applies to every project release made public or official. |
  | _Environment_ | Determines the development environment required for this project. |

</details>

## General

- _Folders:_ Use root folder convention
  <details>
    <summary>Root folder convention</summary>

  ```markdown
    .
    ├── .vscode   # vscode config files
    ├── config    # Extra configuration files
    ├── dist      # Compiled source files (instead of `build`)
    ├── docs      # Documentation files
    ├── scripts   # Utility scripts for devops, setup, packaging, etc.
    ├── src       # Source code files (instead of `lib` or `app`)
    └── tests     # Tests (instead of `specs`)
    ```

  </details>

- _Folders:_ Keep root folder as most as clean as possible, trying to redirect config files to `./config`

- _Files:_ Ident code with 2 spaces

- _Files:_ {LF} for line endings

- _Files:_ Trim trailing whitespaces

- _Files:_ End files with new line

- _Files:_ Max line size of 100 characters

- _Commits:_ Follow [The seven rules of a great Git commit message](https://cbea.ms/git-commit/#seven-rules)

  <details>
    <summary>Seven rules summary</summary>

    ```
    1. Separate subject from body with a blank line
    2. Limit the subject line to 50 characters
    3. Capitalize the subject line
    4. Do not end the subject line with a period
    5. Use the imperative mood in the subject line
    6. Wrap the body at 72 characters
    7. Use the body to explain what and why vs. how
    ```

  </details>

- _Commits:_ Use [Conventional Commits]() for commit messages
  <details>
    <summary>Conventional Commits summary</summary>

    ```
    The commit message should be structured as follows:

    <type>[optional scope]: <description>

    [optional body]

    [optional footer(s)]
    The commit contains the following structural elements, to communicate intent to the consumers of your library:

    fix: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).
    feat: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).
    BREAKING CHANGE: a commit that has a footer BREAKING CHANGE:, or appends a ! after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any type.
    types other than fix: and feat: are allowed, for example @commitlint/config-conventional (based on the the Angular convention) recommends build:, chore:, ci:, docs:, style:, refactor:, perf:, test:, and others.
    footers other than BREAKING CHANGE: <description> may be provided and follow a convention similar to git trailer format.

    ```

  </details>

- _Commits_: Include the main related work item (issue, backlog item, etc.) in commit messages using `#ID` convention. When `#ID` prejudice the 50-char subject rule, use commit footer convention to describe related work items.

  <details>
    <summary>Footer example with work item relations</summary>

    ```
    Resolves: #123
    See-also: #151 #101
    ```
  </details>


- _Releases:_ Git tag release code always using [SemVer](https://semver.org/spec/v2.0.0.html)
  <details>
    <summary>SemVer summary</summary>

  ```
  Given a version number MAJOR.MINOR.PATCH, increment the:

  1. MAJOR version when you make incompatible API changes,
  2. MINOR version when you add functionality in a backwards compatible manner, and
  3. PATCH version when you make backwards compatible bug fixes.

  Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.
  ```

  </details>

- _Releases:_ Document commit history since latest release at CHANGELOG.md

- _Environment:_ Use vscode as the default code editor

- _Environment:_ Use vscode recommended extensions at .vscode/extensions.json folder
  <details>
    <summary>Recommended extensions</summary>

  | Extension                    | Why                                                   |
  |------------------------------|-------------------------------------------------------|
  | `editorconfig.editorconfig`  | To make sure .editorconfig will work as expected      |
  | `aaron-bond.better-comments` | For highlighting TODO's and other comments formatting |
  | `usernamehw.errorlens` | For highlighting code errors and problems inside editor
  | `wayou.vscode-todo-highlight`| For highlighting TODO's even more |
  | `gruntfuggly.todo-tree` | To easily list TODO's in vscode |
  | `shardulm94.trailing-spaces` | For highlighting trailing whitespaces |
  | `visualstudioexptteam.vscodeintellicode` | To help autocompletion |
  | `oouo-diogo-perdigao.docthis` | To help JSDoc generation |
  | `mikestead.dotenv` | Support for dotenv files syntax |
  | `dbaeumer.vscode-eslint` | To make sure .eslintrc will be followed |
  | `orkhanjafarovr.vscode-here-and-now` | Quickly installation of missing packages directly from code |
  | `xabikos.javascriptsnippets` | JS snippets for ES6 |
  | `cmstead.js-codeformer` | A JavaScript/TypeScript refactoring and code automation tool |
  | `prosser.json-schema-2020-validation` | JSON Schema validation |
  | `eg2.vscode-npm-script` | npm support for VS Code |
  | `abhijoybasak.npm-audit` | View npm audit security report in visual format |
  | `christian-kohler.npm-intellisense` | Visual Studio Code plugin that autocompletes npm modules in import statements. |
  | `mskelton.npm-outdated` | Help highlighting outdated packages. |

  </details>
