#!/usr/bin/env python3
"""
Medical Contacts Database Backup & Restore Script
Handles MongoDB backup/restore for patient data sharing between mobile app and web dashboard
"""

import os
import json
import subprocess
from datetime import datetime
from typing import Dict, List, Any
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')
BACKUP_DIR = '/app/backups'

class MedicalContactsBackup:
    def __init__(self):
        self.client = AsyncIOMotorClient(MONGO_URL)
        self.db = self.client[DB_NAME]
        
        # Ensure backup directory exists
        os.makedirs(BACKUP_DIR, exist_ok=True)
    
    async def create_backup(self, backup_name: str = None) -> str:
        """
        Create a complete backup of the medical contacts database
        Returns the backup file path
        """
        if not backup_name:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_name = f"medical_contacts_backup_{timestamp}"
        
        backup_path = os.path.join(BACKUP_DIR, f"{backup_name}.json")
        
        print(f"Creating backup: {backup_path}")
        
        # Collections to backup
        collections = ['users', 'patients', 'counters']
        backup_data = {
            'timestamp': datetime.now().isoformat(),
            'database': DB_NAME,
            'collections': {}
        }
        
        for collection_name in collections:
            print(f"Backing up collection: {collection_name}")
            collection = self.db[collection_name]
            
            # Get all documents from collection
            documents = []
            async for doc in collection.find():
                # Convert ObjectId to string for JSON serialization
                doc['_id'] = str(doc['_id'])
                documents.append(doc)
            
            backup_data['collections'][collection_name] = documents
            print(f"  - {len(documents)} documents backed up")
        
        # Write backup to JSON file
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"Backup completed: {backup_path}")
        print(f"Total size: {os.path.getsize(backup_path)} bytes")
        
        return backup_path
    
    async def restore_backup(self, backup_path: str, overwrite: bool = False) -> bool:
        """
        Restore database from backup file
        """
        if not os.path.exists(backup_path):
            print(f"Backup file not found: {backup_path}")
            return False
        
        print(f"Restoring from backup: {backup_path}")
        
        with open(backup_path, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)
        
        print(f"Backup created: {backup_data['timestamp']}")
        print(f"Database: {backup_data['database']}")
        
        for collection_name, documents in backup_data['collections'].items():
            print(f"Restoring collection: {collection_name}")
            collection = self.db[collection_name]
            
            if overwrite:
                # Clear existing data
                await collection.delete_many({})
                print(f"  - Cleared existing data")
            
            if documents:
                # Insert documents
                await collection.insert_many(documents)
                print(f"  - Inserted {len(documents)} documents")
            else:
                print(f"  - No documents to restore")
        
        print("Restore completed successfully")
        return True
    
    async def export_user_data(self, user_email: str) -> str:
        """
        Export all data for a specific user (for web dashboard sync)
        """
        # Find user by email
        user = await self.db.users.find_one({'email': user_email})
        if not user:
            raise ValueError(f"User not found: {user_email}")
        
        user_id = user['id']
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        export_path = os.path.join(BACKUP_DIR, f"user_export_{user_email}_{timestamp}.json")
        
        print(f"Exporting data for user: {user_email}")
        
        # Get user's patients
        patients = []
        async for patient in self.db.patients.find({'user_id': user_id}):
            patient['_id'] = str(patient['_id'])
            patients.append(patient)
        
        # Get user's counter
        counter = await self.db.counters.find_one({'_id': f'patient_id_{user_id}'})
        if counter:
            counter['_id'] = str(counter['_id'])
        
        export_data = {
            'timestamp': datetime.now().isoformat(),
            'user': {k: str(v) if k == '_id' else v for k, v in user.items()},
            'patients': patients,
            'counter': counter,
            'stats': {
                'total_patients': len(patients),
                'favorite_patients': len([p for p in patients if p.get('is_favorite', False)]),
                'groups': list(set(p.get('group', 'general') for p in patients))
            }
        }
        
        with open(export_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"User data exported: {export_path}")
        print(f"Patients: {len(patients)}")
        return export_path
    
    async def list_backups(self) -> List[Dict[str, Any]]:
        """
        List all available backups
        """
        backups = []
        
        if not os.path.exists(BACKUP_DIR):
            return backups
        
        for filename in os.listdir(BACKUP_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(BACKUP_DIR, filename)
                stat = os.stat(filepath)
                
                backups.append({
                    'filename': filename,
                    'filepath': filepath,
                    'size': stat.st_size,
                    'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        
        # Sort by creation date (newest first)
        backups.sort(key=lambda x: x['created'], reverse=True)
        return backups
    
    async def get_database_stats(self) -> Dict[str, Any]:
        """
        Get current database statistics
        """
        stats = {}
        
        # User statistics
        users_count = await self.db.users.count_documents({})
        stats['users'] = {
            'total': users_count,
            'regular_plan': await self.db.users.count_documents({'subscription_plan': 'regular'}),
            'pro_plan': await self.db.users.count_documents({'subscription_plan': 'pro'}),
            'active': await self.db.users.count_documents({'subscription_status': 'active'}),
            'trial': await self.db.users.count_documents({'subscription_status': 'trial'})
        }
        
        # Patient statistics
        patients_count = await self.db.patients.count_documents({})
        stats['patients'] = {
            'total': patients_count,
            'favorites': await self.db.patients.count_documents({'is_favorite': True})
        }
        
        # Patient distribution by user
        pipeline = [
            {'$group': {'_id': '$user_id', 'patient_count': {'$sum': 1}}},
            {'$group': {
                '_id': None, 
                'avg_patients_per_user': {'$avg': '$patient_count'},
                'max_patients_per_user': {'$max': '$patient_count'},
                'min_patients_per_user': {'$min': '$patient_count'}
            }}
        ]
        user_stats = await self.db.patients.aggregate(pipeline).to_list(1)
        if user_stats:
            stats['patient_distribution'] = user_stats[0]
            del stats['patient_distribution']['_id']
        
        return stats
    
    def close(self):
        """Close database connection"""
        self.client.close()

    async def clear_database(self):
        """
        Drop all relevant collections from the database for a clean state.
        """
        collections_to_drop = ['users', 'patients', 'counters']
        print("Clearing database...")
        for collection_name in collections_to_drop:
            print(f"  - Dropping collection: {collection_name}")
            await self.db[collection_name].drop()
        print("Database cleared successfully.")

# CLI Interface
async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Medical Contacts Database Backup Tool')
    parser.add_argument('action', choices=['backup', 'restore', 'export', 'list', 'stats', 'clear'],
                       help='Action to perform')
    parser.add_argument('--file', help='Backup file path (for restore)')
    parser.add_argument('--user', help='User email (for export)')
    parser.add_argument('--name', help='Backup name')
    parser.add_argument('--overwrite', action='store_true', 
                       help='Overwrite existing data during restore')
    
    args = parser.parse_args()
    
    backup_manager = MedicalContactsBackup()
    
    try:
        if args.action == 'backup':
            backup_path = await backup_manager.create_backup(args.name)
            print(f"\n✅ Backup created: {backup_path}")
        
        elif args.action == 'restore':
            if not args.file:
                print("❌ --file parameter required for restore")
                return
            
            success = await backup_manager.restore_backup(args.file, args.overwrite)
            if success:
                print("\n✅ Restore completed successfully")
            else:
                print("\n❌ Restore failed")
        
        elif args.action == 'export':
            if not args.user:
                print("❌ --user parameter required for export")
                return
            
            export_path = await backup_manager.export_user_data(args.user)
            print(f"\n✅ User data exported: {export_path}")
        
        elif args.action == 'list':
            backups = await backup_manager.list_backups()
            if backups:
                print("\n📋 Available Backups:")
                for backup in backups:
                    size_mb = backup['size'] / (1024 * 1024)
                    print(f"  - {backup['filename']} ({size_mb:.1f} MB) - {backup['created']}")
            else:
                print("\n📋 No backups found")
        
        elif args.action == 'stats':
            stats = await backup_manager.get_database_stats()
            print("\n📊 Database Statistics:")
            print(json.dumps(stats, indent=2, default=str))

        elif args.action == 'clear':
            await backup_manager.clear_database()
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
    
    finally:
        backup_manager.close()

if __name__ == "__main__":
    asyncio.run(main())