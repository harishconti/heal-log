import asyncio
import logging
import sys
import os

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend'))
sys.path.insert(0, project_root)

from app.db.init_db import init_dummy_data
from app.db.session import shutdown_db_client

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

async def main():
    logging.info("Starting debug script for init_dummy_data...")
    try:
        await init_dummy_data()
        logging.info("Debug script finished successfully.")
    except Exception as e:
        logging.error(f"An error occurred in the debug script: {e}", exc_info=True)
    finally:
        await shutdown_db_client()
        logging.info("Database connection closed.")

if __name__ == "__main__":
    # This allows running the async main function
    asyncio.run(main())