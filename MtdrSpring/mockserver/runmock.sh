#!/bin/bash
pip -q install fastapi pydantic sqlalchemy
uvicorn fastapidebug:app --reload --port 4000 &
python telegram_bot.py
wait