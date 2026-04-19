# Agent Behavior — Bánh Cá Bốn Mùa

> Read AGENTS.md first — it is the source of truth for all project decisions.
> Read STRUCTURE.md before creating or moving any file.

## Behavior
- NEVER open browser or Chrome automatically
- NEVER run `npm run dev` after making changes
- NEVER run `npm run build` after making changes
- After completing any task: write code, save file, stop — do nothing else
- If a decision in AGENTS.md conflicts with what you think is correct — stop and ask, do not work around silently

## Development Commands (human runs manually)
- Dev server: `npm run dev`
- Build: `npm run build`
- DB push + generate: `npx prisma db push && npx prisma generate`
  (Use this — not `migrate dev`. Supabase + pgBouncer is incompatible with migrate dev.)

## When to load extra context
- Need DB schema details? → Read SCHEMA.md
- Need API route list? → Read API.md
- Deferred issues or BE separation? → Read NOTES.md
