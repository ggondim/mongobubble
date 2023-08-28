```mermaid
graph LR
  core
  %% .
  json-schema --> core
  %% .
  mongobubble --> core
  mongobubble --> json-schema
  mongobubble --> online-archive
  mongobubble --> tsed
  %% .
  online-archive --> core
  %% .
  tsed --> core
  tsed --> json-schema
```
