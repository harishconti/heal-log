#!/usr/bin/env node
/**
 * Script to clean MongoDB database - drops all collections
 */

const { MongoClient } = require('mongodb');
const dns = require('dns');

// Set DNS servers to Google DNS for SRV record resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGO_URL = "mongodb+srv://ngharishdevelop_db_user:59et3NpooEsXuP9E@cluster0.48dsoqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = "clinic_os_lite";

async function cleanDatabase() {
    console.log(`Connecting to MongoDB database: ${DB_NAME}`);

    const client = new MongoClient(MONGO_URL, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
    });

    try {
        await client.connect();
        const db = client.db(DB_NAME);

        // Get all collection names
        const collections = await db.listCollections().toArray();
        console.log(`Found ${collections.length} collections:`, collections.map(c => c.name));

        if (collections.length === 0) {
            console.log("No collections to drop. Database is already clean.");
            return;
        }

        // Drop each collection
        for (const collection of collections) {
            console.log(`Dropping collection: ${collection.name}`);
            await db.dropCollection(collection.name);
            console.log(`  ✓ Dropped ${collection.name}`);
        }

        // Verify cleanup
        const remaining = await db.listCollections().toArray();
        console.log(`\nCleanup complete. Remaining collections:`, remaining.map(c => c.name));

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await client.close();
        console.log("Database connection closed.");
    }
}

cleanDatabase();
