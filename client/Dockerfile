FROM node:20 as build

# Set working directory
WORKDIR /client

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the source code
COPY . .

# Build the Vite application
RUN npm run build

# Expose the Nginx port
EXPOSE 5173
