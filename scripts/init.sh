#!/bin/bash

# Save the current working directory
ORIG_DIR=$(pwd)

# Change to $WORKDIR/client and server
cd $WORKDIR/client

# Install dependencies in client
echo "Installing client dependencies..."
npm install

# Remove the .env file if it exists
sudo rm -f .env
echo "Existing client .env file removed."

# Create new .env file in client directory
CLIENT_ENV_FILE=".env"
{
    echo "VITE_BASE_URL=http://${HOST}:${PORT}"
} > $CLIENT_ENV

echo "Client .env file generated successfully!"

# Change to server directory
cd $WORKDIR/server

# Install dependencies in server
echo "Installing server dependencies..."
npm install

# Compile TypeScript
echo "Compiling TypeScript..."
npm run build

# Remove the .env file if it exists
sudo rm -f .env
echo "Existing server .env file removed."

# Define the path to the .env file in server directory
SERVER_ENV_FILE=".env"

# Write the environment variables to the .env file in server directory
{
    echo "DB_USER=${DBUSER}"
    echo "DB_PASSWORD=${DBPASSWORD}"
    echo "DB_HOST=${HOST}"
    echo "DB_PORT=${DBPORT}"
    echo "DB_NAME=${DBNAME}"
    echo "TABLE_NAME=${TABLENAME}"
    echo "SERVER_PORT=${PORT}"
} > $SERVER_ENV_FILE

echo "Server .env file generated successfully!"

# Return to original directory
cd $ORIG_DIR
