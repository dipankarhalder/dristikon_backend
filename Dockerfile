FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install curl for health checking
RUN apk add --no-cache curl

# Copy dependency definitions
COPY package*.json ./

# Install nodemon globally for robust hot reloading in containers
RUN npm install -g nodemon

# Install dependencies (including nodemon and production packages)
RUN npm install

# Copy application source and configuration files
COPY . .

# Ensure upload asset directories exist
RUN mkdir -p uploads/images uploads/documents

# Set default environment variables
ENV NODE_ENV=development \
    PORT=4000

# Expose backend port
EXPOSE 4000

# Default start command for hot reloading
CMD ["npm", "run", "dev"]
