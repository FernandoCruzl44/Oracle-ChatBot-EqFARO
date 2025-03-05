#!/bin/bash
pip install fastapi pydantic sqlalchemy
uvicorn fastapidebug:app --reload --port 4000
