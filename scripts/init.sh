#!/bin/bash
# Install dependencies
cd client
npm install

# Create .env file in client directory
CLIENT_ENV_FILE=".env"
{
    echo "VITE_BASE_URL=http://${HOST}:${PORT}"
} > $CLIENT_ENV_FILE

echo ".env file generated successfully in client directory!"

# Install dependencies
cd ../server
npm install

# Compile TypeScript
npm run build

# Remove the .env file if it exists
sudo rm -f .env

# Define the path to the .env file
SERVER_ENV_FILE=".env"

# Write the environment variables to the .env file in server directory
{
    echo "DB_USER=${DB_USER}"
    echo "DB_PASSWORD=${DB_PASSWORD}"
    echo "DB_HOST=${HOST}
    echo "DB_PORT=${DB_PORT}"
    echo "DB_NAME=${DB_NAME}"
    echo "TABLE_NAME=${TABLE_NAME}"
    echo "SERVER_PORT=${PORT}"
} > $SERVER_ENV_FILE

echo ".env file generated successfully in server directory!"
