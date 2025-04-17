FROM node:20-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy proxy package configuration and source code
# Copy manifest first for dependency install
COPY packages/proxy/package.json packages/proxy/
COPY packages/proxy/tsconfig.json packages/proxy/
COPY packages/proxy/src packages/proxy/src

# Install dependencies for the proxy package (including devDependencies for build)
# Need to adjust filter syntax slightly for pnpm install within the package context
RUN cd packages/proxy && pnpm install --node-linker=isolated

# Build the proxy package
RUN pnpm --filter @openint/mcp-proxy build

# Switch working directory to the built proxy package location
WORKDIR /app/packages/proxy

# Set NODE_ENV to production for runtime
ENV NODE_ENV production

# Expose a default port (optional, depends on proxy implementation)
# EXPOSE 3000

# Run the proxy server, assuming it accepts commands somehow (TBD)
# This might need adjustment based on the simplified proxy logic
ENTRYPOINT ["node", "dist/index.js"]