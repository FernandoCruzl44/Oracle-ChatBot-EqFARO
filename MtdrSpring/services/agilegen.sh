#!/bin/bash
docker stop agileContainer
docker rm -f agileContainer
mvn verify
docker build -f Dockerfile --platform linux/amd64,linux/arm64 -t agileimage:0.1 .  
docker run --name agilecontainer -p 8080:8080 -d agileimage:0.1 -e TNS_ADMIN=/app/wallet 
#-v /Users/ramirouziel/Developer/Wallet_SpringBootATP:/app/wallet -d agileimage:0.1
