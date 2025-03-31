#!/bin/bash
set -e

# Build the application
echo "Building application..."
rm -rf target
mvn verify

# Build Docker image
echo "Building Docker image..."
docker buildx build --platform linux/amd64 -f Dockerfile -t faroimage .

# Set the OCI registry variables
REGISTRY="mx-queretaro-1.ocir.io"
NAMESPACE="axco8elk7e3y"
RUN_NAME="okay"
IMAGE_NAME="faro"
TAG="v1.0"
MTDR_KEY="v"

# Full path including MTDR_KEY
FULL_IMAGE_PATH="$REGISTRY/$NAMESPACE/$RUN_NAME/$IMAGE_NAME:$TAG-$MTDR_KEY"

# # Check if already logged in to registry, if not prompt for login
# if ! docker info | grep -q "$REGISTRY"; then
#     echo "Docker login required for $REGISTRY"
#     read -p "Enter your username: " USERNAME
#     read -s -p "Enter your auth token: " AUTH_TOKEN
#     echo
#     echo "$AUTH_TOKEN" | docker login -u "$NAMESPACE/$USERNAME" --password-stdin "$REGISTRY"
#     echo "Login successful"
# fi

# Tag and push the image with MTDR_KEY in the path
echo "Tagging image: $FULL_IMAGE_PATH"
docker tag faroimage "$FULL_IMAGE_PATH"

echo "Pushing image to OCI registry..."
docker push "$FULL_IMAGE_PATH"

echo "Successfully pushed image: $FULL_IMAGE_PATH"
echo "MTDR_KEY: $MTDR_KEY (saved to $MTDR_KEY_FILE for future use)"
