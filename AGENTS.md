<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Neon MCP Database Access Rules
  - Connect Neon MCP only to a database project named `BlogDB` in my Neon account

# Database Migrations
  - If you need to modify the database, follow the standard Drizzle workflow: change drizzle schema file --> generate migration --> migrate to neon DB
