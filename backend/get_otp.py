import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_otp():
    MONGO_URL = "mongodb+srv://ngharishdevelop_db_user:59et3NpooEsXuP9E@cluster0.48dsoqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    DB_NAME = "clinic_os_lite"
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    user = await db.users.find_one({"email": "ngharishjobs@gmail.com"})
    if user:
        print("User found:", user.get("email"))
        print("OTP Code:", user.get("otp_code"))
        print("Is Verified:", user.get("is_verified"))
    else:
        print("User not found")
    
    client.close()

asyncio.run(get_otp())
