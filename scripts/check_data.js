#!/usr/bin/env node
/**
 * Script to check patient data in MongoDB for a specific user
 */

const { MongoClient } = require('mongodb');
const dns = require('dns');

// Set DNS servers to Google DNS for SRV record resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGO_URL = "mongodb+srv://ngharishdevelop_db_user:59et3NpooEsXuP9E@cluster0.48dsoqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = "clinic_os_lite";

async function checkData() {
    console.log(`Connecting to MongoDB database: ${DB_NAME}`);

    const client = new MongoClient(MONGO_URL, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
    });

    try {
        await client.connect();
        const db = client.db(DB_NAME);

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log(`\nFound ${collections.length} collections:`, collections.map(c => c.name));

        // Check users
        const usersCollection = db.collection('users');
        const users = await usersCollection.find({}).toArray();
        console.log(`\n=== USERS (${users.length}) ===`);
        users.forEach(u => {
            console.log(`  - ${u.email} (id: ${u._id})`);
        });

        // Find user by email
        const targetEmail = 'ngharishjobs@gmail.com';
        const targetUser = await usersCollection.findOne({ email: targetEmail });
        console.log(`\n=== Target User (${targetEmail}) ===`);
        if (targetUser) {
            console.log(`  User ID: ${targetUser._id}`);
            console.log(`  Full Name: ${targetUser.full_name}`);

            // Check patients for this user
            const patientsCollection = db.collection('patients');
            const patientCount = await patientsCollection.countDocuments({ user_id: String(targetUser._id) });
            console.log(`\n=== PATIENTS for this user: ${patientCount} ===`);

            const patients = await patientsCollection.find({ user_id: String(targetUser._id) }).limit(10).toArray();
            patients.forEach(p => {
                console.log(`  - ${p.name} (id: ${p._id}, patient_id: ${p.patient_id}, user_id: ${p.user_id})`);
            });

            // Also check with ObjectId string match
            const patientCount2 = await patientsCollection.countDocuments({ user_id: targetUser._id.toString() });
            console.log(`\n=== PATIENTS (string match): ${patientCount2} ===`);

            // Check clinical_notes for this user
            const notesCollection = db.collection('clinical_notes');
            const noteCount = await notesCollection.countDocuments({ user_id: String(targetUser._id) });
            console.log(`\n=== CLINICAL NOTES for this user: ${noteCount} ===`);
        } else {
            console.log(`  User not found!`);
        }

        // Show all patients regardless of user
        const allPatients = await db.collection('patients').find({}).toArray();
        console.log(`\n=== ALL PATIENTS in DB (${allPatients.length}) ===`);
        allPatients.forEach(p => {
            console.log(`  - ${p.name} (id: ${p._id}, user_id: ${p.user_id})`);
        });

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await client.close();
        console.log("\nDatabase connection closed.");
    }
}

checkData();
