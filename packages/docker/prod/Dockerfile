FROM node:20-alpine

WORKDIR /app

# Install the latest proxy package from npm
# Using npm directly as pnpm isn't strictly needed for just runtime install
RUN npm install @openint/mcp-proxy@latest --no-package-lock --no-save

# Call the installed script directly using node
ENTRYPOINT ["node", "/app/node_modules/@openint/mcp-proxy/dist/index.js"] 