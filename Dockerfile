FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install curl for health checking
RUN apk add --no-cache curl

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Set default environment variables
ENV NODE_ENV=development \
    PORT=4000

# Expose backend port
EXPOSE 4000

# Default start command
CMD ["npm", "start"]
