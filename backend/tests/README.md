# Backend Tests

This directory contains all of the backend tests for the application.

## Running the Tests

To run all of the tests, run the following command from the root of the project:

```bash
SECRET_KEY=test MONGO_URL=mongodb://localhost:27017 DB_NAME=test_db PYTHONPATH=backend python3 -m pytest backend/tests/
```

## Load Testing

To run the load test, run the following command from the root of the project:

```bash
locust -f backend/tests/load_test.py
```

This will start the Locust web UI on port 8089. You can then open a browser to http://localhost:8089 and start the test.
