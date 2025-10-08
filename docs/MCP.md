# shadcn MCP Integration

This project is configured to work with the [shadcn MCP server](https://ui.shadcn.com/docs/mcp), allowing Codex (and other MCP-capable clients) to browse and install UI components directly from shadcn-compatible registries.

## Prerequisites

- Node.js 18 or 20 (matching the project requirements)
- `shadcn` CLI (already listed as a dev dependency)
- An MCP client such as Codex, Cursor, or Claude Code

## Start the MCP Server

From the project root, run:

```bash
npm run mcp
```

This runs `npx shadcn@latest mcp`, which exposes MCP tools for listing, searching, and installing components.

## Configure Codex

Update `~/.codex/config.toml` so Codex can discover the server:

```toml
[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]
```

Restart Codex after editing the file. You can then use prompts such as:

- "Show me all available components in the shadcn registry"
- "Install the button and dialog components"
- "Find a login form from the shadcn registry"

These examples come directly from the MCP documentation.

## Configure Registries

`components.json` already exists at the project root. Registries can be added there to expose additional component sources to the MCP server. The structure matches the documentation:

```json
{
  "registries": {
    "@acme": "https://registry.acme.com/{name}.json",
    "@internal": {
      "url": "https://internal.company.com/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}"
      }
    }
  }
}
```

Environment variables for registry authentication can be stored in `.env.local` (e.g. `REGISTRY_TOKEN`). The default shadcn/ui registry requires no additional configuration.

## Troubleshooting

- **Server not responding**: confirm the MCP server is running (`npm run mcp`) and Codex has been restarted.
- **Registry access issues**: verify URLs and any required authentication headers in `components.json`.
- **Installation failures**: ensure `components.json` paths are correct and that the project directories are writable.
- **No tools or prompts**: clear the npx cache (`npx clear-npx-cache`) and re-enable the server in your MCP client.

Refer to the official documentation for more examples, namespace usage, and advanced setup details.
