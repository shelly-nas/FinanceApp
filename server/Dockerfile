FROM node:20 as build

# Set working directory
WORKDIR /server

# Copy package.json and install dependencies
COPY package.json package-lock.json tsconfig.json ./
RUN npm install

# Copy the source code
COPY src ./src

# Compile TypeScript to JavaScript
RUN npm run build

# Expose the server port
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]
