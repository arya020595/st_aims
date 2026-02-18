FROM node:18-slim

# Install OpenSSL and build tools for native modules
RUN apt-get update -y && apt-get install -y openssl python3 make g++ liblzma-dev bzip2 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json yarn.lock ./
COPY services/graphql/package.json ./services/graphql/
COPY services/app/package.json ./services/app/

# Install all workspace dependencies
RUN yarn install --frozen-lockfile --production=false --ignore-engines

# Copy App service source
COPY services/app/ ./services/app/

# Copy GraphQL files needed by the app (cross-service imports)
COPY services/graphql/role-privileges.json ./services/graphql/role-privileges.json
COPY services/graphql/public/ ./services/graphql/public/

# Create a minimal .env for the Next.js build step
RUN echo "APP_PORT=3001\nGRAPHQL_API_HOST=graphql\nGRAPHQL_API_PORT=4000\nTOKENIZE=build_placeholder" > .env

# Patch extract-files exports for Node 18 compatibility (trailing-slash deprecated)
RUN node -e "\
  const fs = require('fs'); \
  const p = JSON.parse(fs.readFileSync('node_modules/extract-files/package.json', 'utf8')); \
  p.exports['./public/*'] = './public/*.js'; \
  p.exports['./public/extractFiles'] = './public/extractFiles.js'; \
  p.exports['./public/extractFiles.js'] = './public/extractFiles.js'; \
  p.exports['./public/isExtractableFile'] = './public/isExtractableFile.js'; \
  p.exports['./public/isExtractableFile.js'] = './public/isExtractableFile.js'; \
  fs.writeFileSync('node_modules/extract-files/package.json', JSON.stringify(p, null, 2));"

# Build Next.js app (needs --openssl-legacy-provider for webpack 4)
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN cd services/app && npx next build

WORKDIR /app/services/app

EXPOSE 3001

# NODE_OPTIONS needed at runtime too for Next.js dev/start with webpack 4
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV NODE_ENV=production

CMD ["node", "server/index.js"]
