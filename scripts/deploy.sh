#!/bin/bash

# Usage: ./deploy.sh <config> <workspace>
# Example: ./deploy.sh client /home/pi/repos 

# Validate arguments
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <config> <workspace>
    configs=[client or server]
    workspace=[\"Full/directory/path\"]"
    exit 1
fi

# Read command-line arguments
CONFIG=$1
REPO_NAME="finance-app"
WORKSPACE=$2
SERVICE_NAME="$REPO_NAME-$CONFIG"

# Path for the systemd service and timer file
SERVICE_PATH="/etc/systemd/system/$SERVICE_NAME.service"

# Disable and remove system service file
sudo systemctl stop $SERVICE_NAME.service
sudo systemctl disable $SERVICE_NAME.service
sudo rm $SERVICE_PATH

# Determine ExecStart based on the configuration
case $CONFIG in
    client)
        EXEC_START="/home/pi/.nvm/versions/node/v20.11.1/bin/npx vite"
        ;;
    server)
        EXEC_START="/home/pi/.nvm/versions/node/v20.11.1/bin/npx nodemon dist/index.js"
        ;;
    *)
        echo "Invalid config. Allowed values are: client, server, or plus."
        exit 1
        ;;
esac

# Create the systemd service configuration
echo "[Unit]
Description=Finance App ($CONFIG)
Documentation=https://github.com/GRJX/FinanceApp
After=network.target

[Service]
Type=simple
User=pi
ExecStart=$EXEC_START
WorkingDirectory=$WORKSPACE
Restart=on-failure

[Install]
WantedBy=multi-user.target" | sudo tee $SERVICE_PATH

# Reload systemd configuration, enable, and start the service
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME.service
sudo systemctl start $SERVICE_NAME.service
