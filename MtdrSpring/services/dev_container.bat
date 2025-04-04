@echo off
REM This is the .bat file equivalent of the bash script

REM Run Maven package
call mvn package

REM If Maven succeeded, build the Docker image
IF %ERRORLEVEL% EQU 0 (
    REM Build Docker image with platform parameter
    docker build -f Dockerfile --platform %PLATFORM% -t agileimage:0.1 .
    
    REM If Docker build succeeded, run the container
    IF %ERRORLEVEL% EQU 0 (
        docker run --rm -p 8080:8080 agileimage:0.1
    ) ELSE (
        echo Docker build failed
    )
) ELSE (
    echo Maven package failed
)