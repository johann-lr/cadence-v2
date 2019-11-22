#!/bin/bash
# Creates docker image and saves it to /docker dir
echo "Building Docker Image Cadence..."
docker build -t cadence .
echo "Save docker image to local directory..."
if ! [ -d "./docker" ]; then
    echo "Creating directory ./docker"
fi
docker save -o ./docker/cadence.tar cadence
echo "Make sure you remove older images using <docker rmi>"
echo "Success!"
echo "Run: docker run -d -p 443:443 80:80 cadence"
