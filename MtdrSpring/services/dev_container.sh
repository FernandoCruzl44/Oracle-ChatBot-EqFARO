#!/bin/bash

mvn package \
    && docker build -f Dockerfile --platform linux/amd64 -t agileimage:0.1 .  \
    && docker run --rm -p 8080:8080  agileimage:0.1
