# Skill Registry — tinpet-web

## Global Skills (`~/.config/opencode/skills/`)

### SDD Workflow Skills
| Skill | Path | Description |
|-------|------|-------------|
| sdd-init | `~/.config/opencode/skills/sdd-init/SKILL.md` | Initialize SDD in a project |
| sdd-explore | `~/.config/opencode/skills/sdd-explore/SKILL.md` | Explore/investigate ideas |
| sdd-propose | `~/.config/opencode/skills/sdd-propose/SKILL.md` | Create change proposals |
| sdd-spec | `~/.config/opencode/skills/sdd-spec/SKILL.md` | Write delta specs |
| sdd-design | `~/.config/opencode/skills/sdd-design/SKILL.md` | Write technical designs |
| sdd-tasks | `~/.config/opencode/skills/sdd-tasks/SKILL.md` | Break down implementation tasks |
| sdd-apply | `~/.config/opencode/skills/sdd-apply/SKILL.md` | Implement task code |
| sdd-verify | `~/.config/opencode/skills/sdd-verify/SKILL.md` | Validate implementation |
| sdd-archive | `~/.config/opencode/skills/sdd-archive/SKILL.md` | Archive completed changes |

### SDD Shared Conventions
| File | Purpose |
|------|---------|
| `~/.config/opencode/skills/_shared/engram-convention.md` | Engram artifact naming and recovery |
| `~/.config/opencode/skills/_shared/persistence-contract.md` | Mode behavior and persistence |
| `~/.config/opencode/skills/_shared/openspec-convention.md` | OpenSpec file layout |

### Other Global Skills
| Skill | Path | Description |
|-------|------|-------------|
| skill-creator | `~/.config/opencode/skills/skill-creator/SKILL.md` | Create AI agent skills |
| go-testing | `~/.config/opencode/skills/go-testing/SKILL.md` | Go testing patterns |

## User-Level Skills (`~/.agents/skills/`)

| Skill | Path | Description |
|-------|------|-------------|
| caveman | `~/.agents/skills/caveman/SKILL.md` | Ultra-compressed communication |
| find-skills | `~/.agents/skills/find-skills/SKILL.md` | Discover and install skills |

## Project-Level Skills (`.agents/skills/`)

| Skill | Path | Description |
|-------|------|-------------|
| find-skills | `.agents/skills/find-skills/SKILL.md` | Discover and install skills |
| vercel-react-best-practices | `.agents/skills/vercel-react-best-practices/` | 62 React/Next.js optimization rules |
| web-design-guidelines | `.agents/skills/web-design-guidelines/SKILL.md` | UI/design compliance review |

### vercel-react-best-practices — Categories
- **async/** — Parallel fetching, suspense, defer patterns
- **bundle/** — Dynamic imports, preload, tree-shaking
- **client/** — Event listeners, localStorage, SWR dedup
- **js/** — Cache property access, early exit, flatMap, index maps, loops
- **rendering/** — useTransition, SVG, hydration, content-visibility
- **rerender/** — Memo, derived state, functional setState, lazy init
- **server/** — Serialization, hoist static IO, cache, auth actions
- **advanced/** — useLatest, init-once, event handler refs

## Auto-Load Guidelines
SDD skills auto-load based on SDD workflow phases.
- React/TS work → load `vercel-react-best-practices`
- UI review → load `web-design-guidelines`
- Token efficiency needed → load `caveman`
