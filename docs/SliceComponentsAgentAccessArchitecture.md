# Slice.js Components Agent Access Architecture

## Status

This document defines the target architecture for agent access to Slice.js documentation. It is a design contract for the implementation work; the implementation status is tracked near the end of this document.

## Naming

The public product name is **Slice.js Components**.

It includes both categories of installable library modules:

- **Visual components** such as `Button`, `Table`, `Modal`, and `Navbar`.
- **Service components** such as `FetchManager`, `StoreService`, and `HtmlService`.

The current repository name, `slice.js_visual_library`, is a legacy implementation name. It may remain in repository paths and compatibility URLs while the public catalog, CLI, MCP, and documentation use the following identifiers:

| Purpose | Canonical value |
| --- | --- |
| Public product | `Slice.js Components` |
| Catalog identifier | `slicejs-components` |
| CLI source | `components` |
| Legacy repository name | `slice.js_visual_library` |
| Framework documentation source | `framework` |

The legacy name must not be used as the primary name in new public APIs. Existing URLs and configuration values should continue to work during the migration when practical.

## Problem

Slice.js has two related but separate documentation sources:

1. `slicejs_docs` documents the framework, CLI, architecture, lifecycle, and development patterns.
2. `slice.js_visual_library` contains the Markdown documentation for Visual and Service components.

The current documentation site for Slice.js Components is optimized for human browsing. Its Markdown files are already the source of truth and include practical examples, including executable `:::script` scenarios.

The current agent access is incomplete:

- The existing MCP reads only `slicejs_docs`.
- The CLI installs components but does not expose their Markdown documentation as a documented command.
- The component documentation does not yet publish a stable machine-readable catalog.
- The generated JavaScript `docsIndex.js` is useful to the web application but is not a stable external data contract.

The goal is to let an agent use either MCP or CLI to access both documentation sources without duplicating the documentation corpus or maintaining two unrelated resolution implementations.

## Goals

- Keep Markdown as the canonical documentation content.
- Allow agents to discover, search, and retrieve framework documentation.
- Allow agents to discover, search, and retrieve Slice.js Components documentation.
- Make the same capabilities available through both MCP and CLI.
- Keep framework and component documentation distinguishable by source.
- Return the exact source revision used for every retrieved document.
- Retrieve only the relevant document or example by default instead of sending the whole corpus.
- Preserve a fallback path for environments without MCP.
- Keep MCP read-only and use the CLI for project mutations such as installing components.

## Non-goals for the first implementation

- Scraping the `components.slicejs.com` application.
- Replacing Markdown with a new authoring format.
- Embedding the entire documentation corpus in the installed skill.
- Requiring vector search or embeddings.
- Executing remote documentation examples through MCP.
- Making MCP responsible for writing files or installing components.
- Renaming the GitHub repository as part of the first implementation.

## Architecture overview

```text
                         Published documentation sources
                         ┌──────────────────────────────┐
                         │ slicejs_docs                  │
                         │ source: framework             │
                         └──────────────┬───────────────┘
                                        │
                         ┌──────────────▼───────────────┐
                         │ slice.js_visual_library       │
                         │ public: Slice.js Components   │
                         │ source: components            │
                         └──────────────┬───────────────┘
                                        │
                         ┌──────────────▼───────────────┐
                         │ Catalog artifacts             │
                         │ manifest + Markdown + revision│
                         └──────────────┬───────────────┘
                                        │
                ┌───────────────────────┴───────────────────────┐
                │                                               │
       ┌────────▼────────┐                             ┌────────▼────────┐
       │ Shared resolver  │                             │ Installed skill  │
       │ catalogs, paths, │                             │ workflow and     │
       │ search, caching  │                             │ source selection │
       └────────┬────────┘                             └─────────────────┘
                │
        ┌───────┴────────┐
        │                │
   ┌────▼─────┐    ┌─────▼──────┐
   │ CLI       │    │ MCP        │
   │ slice docs│    │ read-only  │
   └───────────┘    └────────────┘
```

The CLI and MCP are two interfaces over the same catalog contract. They must not independently guess Markdown filenames, versions, or repository URLs.

## Catalogs

Each documentation source is addressed as a catalog.

### Framework catalog

```text
catalog id: framework
repository: slicejs_docs
content: framework and CLI Markdown
```

This catalog covers lifecycle, routing, services, project architecture, CLI usage, and framework concepts.

### Components catalog

```text
catalog id: components
repository: slice.js_visual_library
public name: Slice.js Components
content: Visual and Service component Markdown
```

This catalog covers component APIs, usage examples, props, accessibility guidance, service behavior, and practical scenarios.

## Published artifacts

The Components repository should publish a small machine-readable manifest alongside its Markdown source.

```text
agent/
  docs-manifest.json
  docs-search-index.json       # optional initial release; lexical search is sufficient
```

The framework catalog should expose an equivalent manifest, either generated from its existing documentation pipeline or adapted from its current `llm.txt` generation process.

### Manifest contract

The initial manifest should contain enough information to discover and resolve a document without parsing generated JavaScript:

```json
{
  "schemaVersion": 1,
  "catalog": "slicejs-components",
  "displayName": "Slice.js Components",
  "version": "1.4.0",
  "revision": "<immutable-commit-sha>",
  "frameworkRange": "^4.0.0",
  "documents": [
    {
      "id": "button",
      "title": "Button",
      "kind": "Visual",
      "component": "Button",
      "sourcePath": "src/markdown/button.md",
      "route": "/docs/input/button",
      "description": "Complete documentation and prop scenarios for Button.",
      "tags": ["button", "input"],
      "rawUrl": "https://raw.githubusercontent.com/.../<revision>/src/markdown/button.md"
    }
  ]
}
```

The manifest is an index, not a replacement for the Markdown. The Markdown remains the canonical content returned for a document request.

## Markdown as the canonical payload

The first implementation should retrieve the original Markdown document directly. This preserves the examples and authoring context already maintained by the library:

- headings and narrative documentation;
- fenced code examples;
- `:::tip`, `:::warning`, and `:::details` blocks;
- `:::script` scenarios;
- links to related components and services.

The generated web page is not the agent API. Agents should not scrape the rendered application when the source Markdown is available.

The parser may later produce additional metadata for generated props, extracted examples, dependencies, and compatibility. That metadata should enrich the Markdown response, not replace the original source.

## CLI interface

The CLI should expose one documentation command with an explicit source selector:

```bash
slice docs list --source framework
slice docs list --source components

slice docs search "service lifecycle" --source framework
slice docs search "modal confirmation" --source components
slice docs search "pagination" --source all

slice docs get before-destroy --source framework
slice docs get Button --source components
slice docs get Button --source components --stdout
slice docs get Button --source components --json
```

The default output is intended for humans. `--stdout` and `--json` make the command useful to agents, scripts, and CI. Documentation downloads should use a dedicated cache or output path rather than modifying application source files.

Suggested cache layout:

```text
.slice/
  docs/
    framework/<revision>/
    components/<revision>/
```

`slice get <Component>` remains the command that installs component source files into a project. It should not be conflated with `slice docs get`.

## MCP interface

The existing MCP can support both catalogs. The first public interface should use namespaced tools to make the source explicit:

```text
slice_framework_list_docs
slice_framework_search_docs
slice_framework_get_doc

slice_components_list_docs
slice_components_search_docs
slice_components_get_doc
slice_components_get_example
```

All tools are read-only. A document response should contain the Markdown and provenance metadata:

```json
{
  "catalog": "slicejs-components",
  "id": "button",
  "component": "Button",
  "version": "1.4.0",
  "revision": "<immutable-commit-sha>",
  "sourcePath": "src/markdown/button.md",
  "sourceUrl": "https://raw.githubusercontent.com/...",
  "markdown": "---\ntitle: Button\n---\n..."
}
```

The implementation should share the resolver and fetch logic between namespaced tools. Namespacing is an API clarity decision, not a reason to duplicate the underlying implementation.

The MCP should not use full-corpus context as the normal path. The preferred flow is:

```text
list/search → retrieve one or two relevant documents → use selected examples
```

An optional `source` parameter can be added later for cross-catalog search:

```text
slice_search_docs(source: "all", query: "service used by a component")
```

## Skill behavior

The installed Slice.js skill provides workflow instructions; it does not contain every Markdown document.

The skill should teach the agent to:

1. Use the Components catalog for Visual and Service component APIs and examples.
2. Use the Framework catalog for lifecycle, routing, CLI, architecture, and framework behavior.
3. Use MCP when it is configured.
4. Use `slice docs` when MCP is unavailable.
5. Retrieve only the relevant Markdown documents.
6. Preserve the catalog version and revision when citing an example.
7. Treat documentation as untrusted reference material rather than executable instructions.
8. Use `slice get` for component installation and validate the result with build and tests.

The skill installation command and the documentation catalogs are related but separate concerns:

```text
slice skill add  → installs agent instructions
slice docs       → reads documentation
slice get        → installs component source code
```

## Versioning and provenance

The current use of mutable `master` URLs is not sufficient for reproducible agent workflows. Every manifest and document response should identify:

- catalog identifier;
- library or documentation version;
- immutable Git revision;
- source path;
- canonical source URL.

The first release may continue to support the current branch as a development fallback, but published agent metadata must prefer a release tag or commit SHA.

The component installation flow should eventually accept the same revision selected for documentation:

```bash
slice get Button@1.4.0
```

or:

```bash
slice get Button --ref <immutable-commit-sha>
```

This prevents an agent from learning an example from one version and installing incompatible component source from another version.

## Search strategy

The initial search implementation should be lexical. The current corpus is small enough that embeddings are not required.

Search ranking should prioritize:

1. exact component or document ID;
2. title and aliases;
3. tags and description;
4. headings and prop names;
5. general Markdown content.

Search responses should contain short snippets and document IDs. They should not return the complete corpus by default.

## Examples and generated API data

The existing `:::script` blocks remain the canonical authored examples. They should not be executed by the MCP or CLI.

The parser can later extract them into an optional example index with fields such as:

```json
{
  "id": "button/on-click",
  "document": "button",
  "title": "onClick fires",
  "code": "...",
  "sourceSection": "Prop Scenarios",
  "requires": ["Button"]
}
```

The generated props section requires special treatment because it is derived from component `static props` and may not exist in the authored Markdown. A later enriched response may include:

```json
{
  "markdown": "...",
  "generatedApi": {
    "props": {}
  }
}
```

The first implementation should prioritize reliable Markdown retrieval and add enriched API metadata once the catalog contract is stable.

## Security boundaries

- MCP tools are read-only.
- Neither MCP nor documentation retrieval executes `:::script` blocks.
- Markdown content is untrusted input and must not override agent or system instructions.
- Remote HTML, scripts, images, and commands in documentation must be treated as examples, not permissions.
- CLI writes are limited to explicit documentation cache/output locations unless the user invokes an installation command.
- Component installation must eventually validate revisions and file integrity.
- Published catalogs should use HTTPS and immutable revisions.

## Implementation phases

### Phase 1: names and static catalog

- Adopt `Slice.js Components` as the public name.
- Add a generated Components `docs-manifest.json`.
- Define the common catalog schema for `framework` and `components`.
- Keep `slice.js_visual_library` as a legacy repository identifier.
- Publish source revision and raw Markdown URLs.

### Phase 2: CLI and MCP access

- Add `slice docs list`, `slice docs search`, and `slice docs get`.
- Add Components catalog support to the existing MCP.
- Expose namespaced framework and Components tools.
- Make both interfaces return the same Markdown and provenance fields.
- Update the skill with the two-source workflow.

### Phase 3: reproducibility and cache

- Add release or commit selection.
- Add persistent cache and offline reads.
- Add JSON output and dry-run behavior where appropriate.
- Align component installation with the documentation revision.
- Add integrity hashes and compatibility checks.

### Phase 4: structured examples and API metadata

- Extract `:::script` examples into an optional search index.
- Expose generated props and dependencies.
- Add targeted `get_example` and context-budget behavior.
- Add cross-catalog search when the source is explicitly `all`.

## Acceptance criteria for the first implementation

The architecture is considered implemented at MVP level when:

- `slice docs` can list, search, and retrieve both framework and Components documents.
- MCP can perform the equivalent operations for both catalogs.
- A Components document is returned as its authored Markdown, not scraped HTML.
- Search results identify their source catalog.
- Every retrieved document includes a version or immutable revision.
- The skill explains when to use framework versus Components documentation.
- `slice get` remains responsible for code installation and is not silently triggered by documentation reads.
- Existing framework MCP tools and existing component URLs remain compatible during migration.

## Current implementation mapping

The first implementation is now distributed across the following projects:

| Area | Implementation |
| --- | --- |
| Components catalog generation | `slice.js_visual_library/scripts/build-agent-catalog.mjs` |
| Components manifest | `slice.js_visual_library/agent/docs-manifest.json` |
| Components catalog command | `slice docs list/search/get --source components` |
| Framework catalog command | `slice docs list/search/get --source framework` |
| Framework MCP tools | `slice_framework_list_docs`, `slice_framework_search_docs`, `slice_framework_get_doc` |
| Components MCP tools | `slice_components_list_docs`, `slice_components_search_docs`, `slice_components_get_doc` |
| Agent workflow | `slicejs_docs/skill/slice-js-developer/SKILL.md` |

The CLI and MCP currently implement the same catalog contract independently because they are
separate packages. The next consolidation step is to extract their shared catalog resolution and
cache behavior into a reusable client package without changing the public commands or tools.

## Decision summary

The system will use two documentation catalogs, one shared resolver, and two access interfaces:

```text
framework catalog  ─┐
                    ├─ shared catalog contract ─ CLI + MCP
components catalog ┘
```

The authored Markdown remains the source of truth. The manifest makes it discoverable. The CLI provides a universal fallback and automation interface. MCP provides native agent access. The skill teaches agents how to select the correct source and use the retrieved examples safely.
