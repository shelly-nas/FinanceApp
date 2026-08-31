FROM node:20 AS build

# Set working directory
WORKDIR /client

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the source code
COPY . .

# API base URL is baked in at build time by Vite.
# The endpoints in src/api.ts already include the `api/` prefix, so this is the
# site root - nginx proxies /api/ through to the server container.
ARG VITE_BASE_URL=/
ENV VITE_BASE_URL=$VITE_BASE_URL

# Build the Vite application
RUN npm run build

# Serve the static build with Nginx
FROM nginx:alpine

COPY --from=build /client/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
