#!/bin/bash

if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="linux/arm64"
else
    PLATFORM="linux/amd64"
fi

mvn clean package -DskipTests \
        && docker build -f Dockerfile --platform "$PLATFORM" -t agileimage:0.1 .  \
        && docker run --rm -p 8080:8080 agileimage:0.1

docker image rm agileimage:0.1
