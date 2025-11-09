# MongoDB Atlas Free Tier Setup Guide

This guide provides a comprehensive walkthrough for setting up a free M0 tier MongoDB Atlas cluster for the Clinic OS Lite application.

## 1. Account Creation

1.  Navigate to the [MongoDB Atlas website](https://www.mongodb.com/cloud/atlas/register).
2.  Fill in the registration form to create a new account.
3.  Verify your email address to complete the registration.

*(Screenshot: MongoDB Atlas registration page)*

## 2. Creating an M0 Free Tier Cluster

1.  After logging in, you will be prompted to create a new cluster.
2.  Select the **"M0"** free tier option.
3.  Choose a cloud provider and region. We recommend selecting a region that is geographically closest to your users for lower latency.
4.  Give your cluster a name (e.g., `clinicos-lite-cluster`).
5.  Click **"Create Cluster"**.

*(Screenshot: MongoDB Atlas cluster creation page)*

## 3. Database User Configuration

1.  In the cluster dashboard, navigate to **"Database Access"** under the **"Security"** section.
2.  Click **"Add New Database User"**.
3.  Enter a username (e.g., `clinicos_lite_user`).
4.  Generate a strong, secure password and store it safely.
5.  Under **"Database User Privileges"**, select **"Read and write to any database"**.
6.  Click **"Add User"**.

*(Screenshot: MongoDB Atlas database user creation page)*

## 4. Network Access / IP Whitelist Setup

1.  Navigate to **"Network Access"** under the **"Security"** section.
2.  Click **"Add IP Address"**.
3.  To allow access from your local machine, click **"Add My Current IP Address"**.
4.  For production deployments, you will need to add the IP address of your application server.
5.  Click **"Confirm"**.

*(Screenshot: MongoDB Atlas network access page)*

## 5. Connection String Format

1.  In the cluster dashboard, click the **"Connect"** button.
2.  Select **"Connect your application"**.
3.  Choose the **"Python"** driver and the latest version.
4.  Copy the provided connection string. It will look something like this:
    ```
    mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
    ```
5.  Replace `<username>` and `<password>` with the credentials you created in step 3.
6.  Add this connection string to your `.env` file as `MONGO_URL`.

## 6. Database Initialization Requirements

To populate the database with initial data, run the following command from the root of the project:

```bash
python3 run_init_db.py
```

This script will create the necessary collections and seed the database with initial data.

## 7. Index Creation for Collections

The application's schemas define the following indexes that are crucial for performance:

*   **Users Collection:**
    *   A unique index on the `email` field to ensure that each user has a unique email address.
*   **Patients Collection:**
    *   A compound unique index on `(user_id, patient_id)` to ensure that each patient has a unique ID per user.
    *   A compound index on `(user_id, created_at)` to optimize queries for fetching patients for a specific user, sorted by creation date.
*   **Clinical Notes Collection:**
    *   An index on `patient_id` to quickly retrieve all notes for a specific patient.
    *   An index on `user_id` to quickly retrieve all notes for a specific user.

These indexes are automatically created by the application when it starts up.

## 8. Monitoring and Alerts Setup

1.  In the cluster dashboard, navigate to the **"Metrics"** tab to monitor the performance of your cluster.
2.  Go to the **"Alerts"** section to configure basic alerts for metrics like CPU usage, memory usage, and disk space.

*(Screenshot: MongoDB Atlas monitoring page)*

## 9. Backup Configuration

The M0 free tier includes daily backups. You can view and restore backups from the **"Backup"** tab in the cluster dashboard.

*(Screenshot: MongoDB Atlas backup page)*

## 10. Storage Limit Warnings

The M0 free tier has a storage limit of 512MB. It is important to monitor your storage usage to avoid hitting this limit. You can set up an alert to be notified when your storage usage reaches a certain threshold (e.g., 80%).
