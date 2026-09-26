# Graph Report - PokeStream  (2026-09-26)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 425 nodes · 961 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c7f18b79`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11

## God Nodes (most connected - your core abstractions)
1. `server-only` - 21 edges
2. `mutateRun()` - 18 edges
3. `fail()` - 17 edges
4. `useAction()` - 17 edges
5. `runAction()` - 17 edges
6. `react` - 16 edges
7. `compilerOptions` - 16 edges
8. `cx()` - 14 edges
9. `scripts` - 14 edges
10. `getCurrentRun()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `WidgetPage()` --calls--> `getWidgetStateByToken()`  [EXTRACTED]
  src/app/widget/[token]/page.tsx → src/features/widget/server/widget.service.ts
- `SlotCardProps` --references--> `SlotView`  [EXTRACTED]
  src/features/team/ui/SlotCard.tsx → src/features/team/types.ts
- `ParseResult` --references--> `PokemonSetData`  [EXTRACTED]
  src/core/pokedex/showdown.ts → src/core/pokedex/types.ts
- `SlotData` --inherits--> `PokemonSetData`  [EXTRACTED]
  src/features/team/types.ts → src/core/pokedex/types.ts
- `TeamSectionProps` --references--> `SlotView`  [EXTRACTED]
  src/features/team/ui/TeamSection.tsx → src/features/team/types.ts

## Import Cycles
- None detected.

## Communities (13 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (44): ref_node_events, @prisma/adapter-libsql, server-only, dynamic, GET(), Db, g, prisma (+36 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (36): @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, fuse.js, react, spriteCandidates(), DexIndex, StatID (+28 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (45): @pkmn/dex, dynamic, GET(), ignis, ALLOWED, buildDexIndex(), describeSet(), findSpecies() (+37 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (32): ActionProvider(), Ctx, Runner, useAction(), DashboardState, Dashboard(), ErrorBanner(), regenerateWidgetToken() (+24 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (45): eslintConfig, R, dependencies, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, fuse.js, @libsql/client (+37 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (26): nextConfig, next, ref_node_crypto, zod, src_app_globals, dynamic, dynamic, Home() (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (30): src_core_db_client_slotrow, DexEntry, DexSpecies, Gender, SetDisplay, SpeciesInfo, applyPatch(), calcMaxHp() (+22 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (17): runAction(), ActionResult, DomainError, ErrorCode, toFailure(), adjustHp(), clearSlot(), evolveSlot() (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (12): @libsql/client, ref_node_child_process, ref_node_fs, ref_node_os, ref_node_path, vitest, ALLOWED, errors (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (14): scripts, build, check, db:deploy, db:migrate, db:studio, dev, lint (+6 more)

## Knowledge Gaps
- **117 isolated node(s):** `Props`, `Patch`, `Dialog`, `Optimistic`, `Kind` (+112 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 157 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `server-only` connect `Community 0` to `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **Why does `react` connect `Community 1` to `Community 3`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **What connects `Props`, `Patch`, `Dialog` to the rest of the system?**
  _117 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05926251097453907 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08272859216255443 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09071117561683599 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._