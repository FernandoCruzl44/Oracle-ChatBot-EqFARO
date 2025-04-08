#!/bin/bash

if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="linux/arm64"
else
    PLATFORM="linux/amd64"
fi

RUN_VITE=false
for arg in "$@"; do
    if [[ "$arg" == "--vite" ]]; then
        RUN_VITE=true
    fi
done

mvn package \
        && docker build -f Dockerfile --platform "$PLATFORM" -t agileimage:0.1 .  \
        && docker run --rm -p 8080:8080 agileimage:0.1

if [[ "$RUN_VITE" == true ]]; then
    echo "Starting frontend development server..."
    cd frontend && npm run dev
fi