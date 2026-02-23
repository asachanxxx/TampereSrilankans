# Development Dockerfile for Next.js
FROM node:20-alpine

WORKDIR /app

# Copy backend folder (shared dependencies)
COPY backend ./backend

# Copy event-ui package files
COPY event-ui/package*.json ./event-ui/

# Set working directory to event-ui
WORKDIR /app/event-ui

# Install dependencies
RUN npm ci

# Copy event-ui application code
COPY event-ui .

# Expose port 3000
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
