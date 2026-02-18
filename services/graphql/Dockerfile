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

# Copy GraphQL service source
COPY services/graphql/ ./services/graphql/

# Create a minimal .env for Prisma generate
RUN echo "DATABASE_URL=mysql://root:placeholder@localhost:3306/doa_db\nGRAPHQL_API_PORT=4000\nTOKENIZE=build_placeholder" > .env

# Generate Prisma client
RUN cd services/graphql && npx prisma generate

WORKDIR /app/services/graphql

EXPOSE 4000

CMD ["node", "index.js"]
