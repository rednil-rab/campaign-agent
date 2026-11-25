# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY web/package.json web/package.json

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build everything
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy package files for production
COPY package.json package-lock.json ./
COPY web/package.json web/package.json

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/web/dist ./web/dist

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
