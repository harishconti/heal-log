# Sentry Monitoring Setup

This document outlines the process for setting up and verifying Sentry error monitoring for the FastAPI backend.

## 1. Prerequisites

- A Sentry account and a project created for this application.

## 2. Configuration

1.  **Find your DSN:** In your Sentry project settings, navigate to "Client Keys (DSN)" and copy the DSN value.

2.  **Create a `.env` file:** The application loads environment variables from a `.env` file located in the project's root directory. If you don't have one, create it by copying from the example:
    ```bash
    cp backend/.env.example .env
    ```

3.  **Update `.env`:** Add the following variables to your `.env` file, replacing `your_sentry_dsn_here` with the DSN you copied.

    ```
    SENTRY_DSN=your_sentry_dsn_here
    SENTRY_ENVIRONMENT=beta
    ```

    - `SENTRY_DSN`: The unique identifier for your Sentry project.
    - `SENTRY_ENVIRONMENT`: The environment tag for the errors (e.g., `development`, `beta`, `production`).

## 3. Testing the Integration

To verify that Sentry is correctly capturing errors, a test endpoint has been created.

1.  **Run the backend server.**

2.  **Send a request to the test endpoint:** You can use `curl` or any API client to send a GET request to the following endpoint:
    ```bash
    curl -X GET "http://127.0.0.1:8000/api/debug/sentry-test"
    ```

3.  **Check your Sentry Dashboard:** After sending the request, you should see a new issue appear in your Sentry project's dashboard corresponding to the `Sentry Test Exception`.

## 4. Example Error Capture

The test endpoint `/api/debug/sentry-test` is designed to raise a `ZeroDivisionError` to confirm that Sentry is working.

```python
# From backend/app/api/debug.py
@router.get("/sentry-test")
async def sentry_test():
    """
    Raises an exception to test Sentry error reporting.
    """
    try:
        1 / 0
    except Exception as e:
        sentry_sdk.capture_exception(e)
        raise APIException(status_code=500, detail="Sentry test exception captured.")
```

## 5. Troubleshooting

- **Errors not appearing in Sentry:**
    - Double-check that your `SENTRY_DSN` is correct in your `.env` file.
    - Ensure the backend server was restarted after setting the environment variables.
    - Check the server logs for any Sentry-related initialization errors.

- **Sensitive Data:**
    - Sentry's server-side scrubbing rules should be configured in the Sentry dashboard to prevent sensitive data (e.g., passwords, API keys) from being stored.
