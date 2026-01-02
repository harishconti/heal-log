#!/bin/bash
export PYTHONPATH=./backend
export SECRET_KEY=test
python3 -m pytest backend/tests/
