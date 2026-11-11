FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install curl for health checking
RUN apk add --no-cache curl

# Copy dependency definitions and tsconfig
COPY package*.json tsconfig.json ./

# Install tsx and nodemon globally for robust TypeScript hot reloading in containers
RUN npm install -g tsx nodemon

# Install all dependencies
RUN npm install

# Copy application source and configuration files
COPY . .

# Build TypeScript to dist
RUN npm run build

# Ensure upload asset directories exist
RUN mkdir -p uploads/images uploads/documents

# Set default environment variables
ENV NODE_ENV=development \
    PORT=4000

# Expose backend port
EXPOSE 4000

# Default start command for TypeScript hot reloading
CMD ["npm", "run", "dev"]
