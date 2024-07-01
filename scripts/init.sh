#!/bin/bash

# Function to handle errors
error_handler() {
    echo "Error occurred in script at line: ${1}."
    exit 1
}

# Trap any script errors (non-zero exit codes) and call the error_handler function
trap 'error_handler $LINENO' ERR

# Save the current working directory
WORKDIR=$(pwd)

# Change to $WORKDIR/client and server
cd $WORKDIR/client

# Install dependencies in client
echo "### Installing client dependencies..."
npm install

# Remove the .env file if it exists
sudo rm -f .env
echo "## Existing client .env file removed."

# Create new .env file in client directory
CLIENT_ENV_FILE=".env"
{
    echo "VITE_BASE_URL=http://${HOST}:${PORT}"
} > $CLIENT_ENV_FILE

echo "## Client .env file generated successfully!"

# Change to server directory
cd $WORKDIR/server

# Install dependencies in server
echo "### Installing server dependencies..."
npm install

# Compile TypeScript
echo "## Compiling TypeScript..."
npm run build

# Remove the .env file if it exists
sudo rm -f .env
echo "## Existing server .env file removed."

# Define the path to the .env file in server directory
SERVER_ENV_FILE=".env"

# Write the environment variables to the .env file in server directory
{
    echo "DB_USER=${DB_USER}"
    echo "DB_PASSWORD=${DB_PASSWORD}"
    echo "DB_HOST=${HOST}"
    echo "DB_PORT=${DB_PORT}"
    echo "DB_NAME=${DB_NAME}"
    echo "SERVER_PORT=${PORT}"
    echo "ML_PROBABILITY_THRESHOLD=0.01"
} > $SERVER_ENV_FILE

echo "## Server .env file generated successfully!"
