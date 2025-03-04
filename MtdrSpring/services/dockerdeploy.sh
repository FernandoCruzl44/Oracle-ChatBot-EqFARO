#!/bin/bash
docker stop todolistapp-springboot
docker rm -f todolistapp-springboot

mvn verify

docker build -f Dockerfile --platform linux/amd64,linux/arm64 -t mx-queretaro-1.ocir.io/axco8elk7e3y/reacttodo/1flb5/todolistapp-springboot:0.1 .  
docker run --name agileimage -p 8080:8080 -d mx-queretaro-1.ocir.io/axco8elk7e3y/reacttodo/1flb5/todolistapp-springboot:0.1 
