#!/bin/bash
pip -q install fastapi pydantic sqlalchemy
uvicorn fastapidebug:app --reload --port 4000
