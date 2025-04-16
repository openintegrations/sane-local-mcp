# sane-local-mcp
CLI to wrap any STD/IO local Model Context Protocol (MCP) server in a thin docker container for improved monitoring and security

1. Local MCP isn't safe, but it doesn't need to be this way
2. We introduce a preview CLI that helps fix it (Sane Local MCP)

## 🛑 The Problem with Local STDIO MCP Servers

Local MCP servers using STDIO are inherently risky.

They operate with the same privileges as the host process, which means a malicious or misconfigured server can access sensitive files, execute arbitrary code, or exfiltrate data without proper isolation.

This lack of sandboxing poses significant security concerns, especially when integrating third-party MCP servers.

The [Damn Vulnerable MCP](https://github.com/openint-dev/damn-vulnerable-mcp) project published yesterday does a great job of detailing some of the vulnerabilities with it.

And NO, I don't happen to think that the solution of moving everything to cloud remote servers fixes everything (as is convenient for SaaS vendors that sell you hosted MCP servers).

## ✅ The Solution: Sane Local MCP (Alpha Preview ⚠️)

To address these security challenges, we've developed **Sane Local MCP**, a CLI tool that wraps any MCP server—whether from NPM or a GitHub repository—into a Docker container.

This approach ensures that each server runs in an isolated environment, mitigating the risks associated with direct STDIO execution.

**Usage Examples:**

* Run an NPM-based MCP server

```bash
npx @openint/mcp npx @modelcontextprotocol/server-filesystem
```

* Run a GitHub-based MCP server

```bash
npx @openint/mcp https://github.com/sanity-io/sanity-mcp-server "pnpm install && pnpm start"
```

You can pass environment variables using the -e flag:

```bash
npx @openint/mcp -e API_KEY=your_api_key npx @modelcontextprotocol/server-example
```

### 🧪 How to Use in Claude
To integrate with Claude Desktop, modify the claude_desktop_config.json file:​
```
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@openint/mcp", "npx", "@modelcontextprotocol/server-filesystem"]
    }
  }
}
```

This configuration ensures that the MCP server runs within a Docker container, providing a secure environment for Claude to interact with your local filesystem.​

### 🧪 How to Use in Cursor
For Cursor IDE, add the following to your MCP configuration:
```
{
  "mcpServers": {
    "sanity": {
      "command": "npx",
      "args": ["@openint/mcp", "https://github.com/sanity-io/sanity-mcp-server", "pnpm install && pnpm start"],
      "env": {
        "SANITY_PROJECT_ID": "your_project_id",
        "SANITY_DATASET": "production",
        "SANITY_API_TOKEN": "your_sanity_api_token"
      }
    }
  }
}
```

### 🧪 How to Use in Windmill
In Windmill, you can define a script to start the MCP server:​
bash

```
npx @openint/mcp npx @modelcontextprotocol/server-windmill
```


## Easy to monitor and manage

This enables you to monitor each of your running MCP servers within the Docker Desktop UI and get centralized logging and diagnostics on it.

![Docker Desktop UI](./images/docker_desktop_ui.png)

## TODO:

➡️ Support more than just NodeJS and Python, perhaps with a different container image per CLI

➡️ On Linux, explore unikernels or Firecracker VM

➡️ On Mac containerize using the native container APIs
