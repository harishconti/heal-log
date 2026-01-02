import asyncio
import sys
sys.path.append('backend')
from app.db.init_db import init_dummy_data
from db_backup_restore import MedicalContactsBackup

async def main():
    print("Clearing database...")
    backup_manager = MedicalContactsBackup()
    await backup_manager.clear_database()
    print("Database cleared.")

    print("Initializing dummy data...")
    await init_dummy_data()
    print("Dummy data initialization complete.")

if __name__ == "__main__":
    asyncio.run(main())