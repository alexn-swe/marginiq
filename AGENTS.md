<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## MarginIQ Contributor Guide

### Project overview

MarginIQ is a full-stack marketplace inventory and profit tracking SaaS for resale operations.

### Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Recharts

### Development rules

- Inspect the current implementation before editing.
- Keep changes focused and minimal. Do not rewrite working code.
- Reuse existing components, actions, database helpers, Prisma models, and calculation helpers.
- Keep code beginner-readable and strongly typed.
- Do not add authentication, Docker, CI/CD, or deployment unless specifically requested.
- Do not expose or modify real secrets in `.env`.

### Data rules

- Use PostgreSQL through Prisma.
- Keep inventory and sales relationally linked.
- Preserve item archiving behavior instead of hard deleting sold records.
- Keep marketplace fee and profit calculations centralized.

### Testing commands

```bash
npm run lint
npm run build
npm run dev
npx prisma studio
```

Use `npm run dev` for manual testing and `npx prisma studio` for database verification when needed.

### Git workflow

- Check `git status` before large changes.
- Commit only after automated tests and any necessary manual verification pass.
