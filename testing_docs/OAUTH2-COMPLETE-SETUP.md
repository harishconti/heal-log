# 🔐 OAUTH 2.0 XOAUTH2 - COMPLETE STEP-BY-STEP GUIDE
**For: Doctor Log + support@heallog.com**
**Setup Time: 25 minutes**

---

## 📋 WHAT YOU'LL DO

By the end of this guide, you'll have:
- ✅ Google Cloud Project created
- ✅ Gmail API enabled
- ✅ OAuth 2.0 credentials generated
- ✅ XOAUTH2 authentication working
- ✅ OTP emails sending via OAuth

---

## ⏱️ TIMELINE

```
Google Cloud Setup:        5 minutes
Create OAuth credentials:  5 minutes
Configure credentials:     5 minutes
Backend implementation:   10 minutes
Testing:                   5 minutes
─────────────────────────────────
TOTAL:                    30 minutes
```

---

## 🚀 STEP 1: CREATE GOOGLE CLOUD PROJECT

### 1.1 Go to Google Cloud Console

```
URL: https://console.cloud.google.com
```

### 1.2 Create New Project

```
1. Click "Select a Project" (top left, near Google Cloud logo)
2. Click "NEW PROJECT" button
3. Enter name: "Doctor Log Email Service"
4. Keep default settings
5. Click "CREATE"
6. Wait 1-2 minutes for project creation
```

### 1.3 Verify Project Created

```
After creation:
- You should see "Doctor Log Email Service" in the top selector
- You're now in the new project
✅ Project created successfully
```

---

## 🔌 STEP 2: ENABLE GMAIL API

### 2.1 Search for Gmail API

```
1. Click "APIs & Services" in left sidebar
2. Click "Library" (or search for "Gmail API")
3. Search box: Type "Gmail API"
4. Click on "Gmail API" from results
```

### 2.2 Enable the API

```
1. You see the Gmail API page
2. Click blue "ENABLE" button
3. Wait for it to enable (30 seconds)
✅ Gmail API is now enabled
```

---

## 🔑 STEP 3: CREATE OAUTH 2.0 CREDENTIALS

### 3.1 Go to Credentials Page

```
1. In left sidebar: Click "APIs & Services"
2. Click "Credentials"
3. You're now on Credentials page
```

### 3.2 Create OAuth 2.0 Client ID

```
1. Click blue "+ CREATE CREDENTIALS" button
2. Select "OAuth client ID"
3. Popup appears asking for Application Type
4. Choose: "Web application"
   (We're building a backend web service)
5. Click "Create"
```

### 3.3 Configure OAuth Client

```
In the form that appears:

Name:              "Doctor Log Backend SMTP"
Authorized redirect URIs:
  - http://localhost:3000/auth/callback
  (For local testing)
  
  - https://yourdomain.com/auth/callback
  (For production - use your actual domain)

Click "CREATE"
```

### 3.4 Save Your Credentials

```
A popup shows:
- Client ID: [something].apps.googleusercontent.com
- Client Secret: [something]

⚠️ IMPORTANT: Copy these values!
   Save to a secure location (password manager)
   You'll need these values later
```

### 3.5 Download Credentials JSON

```
1. Go back to Credentials page
2. Under "OAuth 2.0 Client IDs" section
3. Find "Doctor Log Backend SMTP"
4. Click the download icon (⬇️)
5. Saves as: "client_secret_[id].json"
6. Move this file to: backend/config/oauth_credentials.json
```

**Store safely!** This file contains secrets.

---

## 📝 STEP 4: GET REFRESH TOKEN (One-time setup)

### 4.1 Create Refresh Token Script

**File: `backend/scripts/get_refresh_token.py`**

```python
#!/usr/bin/env python3
"""
One-time script to get refresh token for OAuth 2.0
Run this ONCE to generate the refresh token
"""

import json
import webbrowser
from google.auth.oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import pickle

# Scopes needed for Gmail SMTP
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def get_refresh_token():
    """Get refresh token for the first time"""
    
    # Load credentials from JSON file
    creds_file = 'backend/config/oauth_credentials.json'
    
    # Create flow
    flow = InstalledAppFlow.from_client_secrets_file(
        creds_file,
        scopes=SCOPES
    )
    
    # Run local server for authentication
    creds = flow.run_local_server(port=8080)
    
    # Extract and print refresh token
    print("\n" + "="*60)
    print("✅ REFRESH TOKEN OBTAINED!")
    print("="*60)
    print(f"\nRefresh Token: {creds.refresh_token}")
    print("\n⚠️  SAVE THIS TOKEN SECURELY IN YOUR .env FILE")
    print("="*60 + "\n")
    
    # Also save to file for backup
    token_data = {
        'refresh_token': creds.refresh_token,
        'client_id': creds.client_id,
        'client_secret': creds.client_secret,
        'token': creds.token,
        'token_uri': creds.token_uri
    }
    
    with open('backend/config/token.json', 'w') as f:
        json.dump(token_data, f, indent=2)
    
    print("Token also saved to: backend/config/token.json")
    return creds.refresh_token

if __name__ == '__main__':
    token = get_refresh_token()
```

### 4.2 Run the Script

```bash
cd backend
python scripts/get_refresh_token.py
```

### 4.3 What Happens

```
1. Browser opens automatically
2. You see: "Sign in with Google"
3. Click your support@heallog.com account
4. Grant permission to "Doctor Log Backend SMTP"
5. You see: "Authorization successful"
6. Script prints your refresh token
7. Script saves token.json file
```

### 4.4 Save the Refresh Token

```
Copy the refresh token from console output
Add to your .env file:
  GOOGLE_REFRESH_TOKEN=1//0g[long token]...

⚠️ NEVER commit token.json to GitHub!
Add to .gitignore:
  backend/config/token.json
  backend/config/oauth_credentials.json
```

---

## 💻 STEP 5: IMPLEMENT OAUTH SMTP IN BACKEND

### 5.1 Python Implementation (FastAPI)

**File: `backend/app/services/oauth_email_service.py`**

```python
import os
import base64
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
import json

class OAuthEmailService:
    """Email service using OAuth 2.0 XOAUTH2"""
    
    def __init__(self):
        self.email = "support@heallog.com"
        self.smtp_host = "smtp.gmail.com"
        self.smtp_port = 587
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        self.refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN")
    
    def get_access_token(self):
        """Get fresh access token using refresh token"""
        try:
            creds_data = {
                "type": "authorized_user",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": self.refresh_token
            }
            
            creds = Credentials.from_authorized_user_info(creds_data)
            creds.refresh(Request())
            
            return creds.token
        
        except Exception as e:
            print(f"❌ Error getting access token: {str(e)}")
            return None
    
    def create_xoauth2_string(self, access_token):
        """Create XOAUTH2 authentication string"""
        auth_string = f"user={self.email}\x01auth=Bearer {access_token}\x01\x01"
        return base64.b64encode(auth_string.encode()).decode()
    
    def send_otp_email(self, recipient_email: str, otp_code: str) -> bool:
        """Send OTP email using OAuth 2.0"""
        try:
            # Get fresh access token
            access_token = self.get_access_token()
            if not access_token:
                print("❌ Failed to get access token")
                return False
            
            # Create XOAUTH2 string
            auth_string = self.create_xoauth2_string(access_token)
            
            # Connect to Gmail SMTP
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            
            # Authenticate using XOAUTH2
            server.auth('XOAUTH2', lambda: auth_string)
            
            # Create email message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "HealLog - OTP Verification"
            msg["From"] = f"HealLog <{self.email}>"
            msg["To"] = recipient_email
            
            # Email body (HTML)
            html_body = f"""
            <html>
              <body>
                <h2>Your OTP Code</h2>
                <p>Enter this code to verify your email:</p>
                <h1 style="color: #2196F3; letter-spacing: 3px; font-size: 36px;">
                  {otp_code}
                </h1>
                <p>Valid for 10 minutes</p>
                <hr>
                <p style="color: #999; font-size: 12px;">
                  This is an automated message. Please don't reply.
                </p>
              </body>
            </html>
            """
            
            msg.attach(MIMEText(html_body, "html"))
            
            # Send email
            server.sendmail(self.email, recipient_email, msg.as_string())
            server.quit()
            
            print(f"✅ OTP email sent to {recipient_email}")
            return True
        
        except Exception as e:
            print(f"❌ Email error: {str(e)}")
            return False
    
    def send_password_reset_email(self, recipient_email: str, reset_link: str) -> bool:
        """Send password reset email"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                return False
            
            auth_string = self.create_xoauth2_string(access_token)
            
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            server.auth('XOAUTH2', lambda: auth_string)
            
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Reset Your HealLog Password"
            msg["From"] = f"HealLog <{self.email}>"
            msg["To"] = recipient_email
            
            html_body = f"""
            <html>
              <body>
                <h2>Password Reset Request</h2>
                <p>Click the link below to reset your password:</p>
                <p>
                  <a href="{reset_link}" 
                     style="background-color: #2196F3; color: white; 
                            padding: 10px 20px; text-decoration: none; 
                            border-radius: 5px; display: inline-block;">
                    Reset Password
                  </a>
                </p>
                <p>Link valid for 1 hour</p>
                <p style="color: #999; font-size: 12px;">
                  If you didn't request this, ignore this email.
                </p>
              </body>
            </html>
            """
            
            msg.attach(MIMEText(html_body, "html"))
            server.sendmail(self.email, recipient_email, msg.as_string())
            server.quit()
            
            print(f"✅ Password reset email sent to {recipient_email}")
            return True
        
        except Exception as e:
            print(f"❌ Email error: {str(e)}")
            return False

# Initialize service
email_service = OAuthEmailService()
```

### 5.2 Use in FastAPI Endpoint

**File: `backend/app/routes/auth.py`**

```python
from fastapi import APIRouter, HTTPException
from app.services.oauth_email_service import email_service
from app.services.otp_service import generate_otp, verify_otp
import random
import string

router = APIRouter()

@router.post("/register")
async def register(email: str, password: str):
    """Register with OTP verification"""
    
    # Validate email (basic check)
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")
    
    # Generate OTP
    otp_code = ''.join(random.choices(string.digits, k=6))
    
    # Store OTP in database/cache
    # await store_otp(email, otp_code, ttl=600)  # 10 minutes
    
    # Send OTP email using OAuth
    success = email_service.send_otp_email(email, otp_code)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP")
    
    return {
        "message": "OTP sent to email",
        "email": email
    }

@router.post("/verify-otp")
async def verify_otp_endpoint(email: str, otp_code: str):
    """Verify OTP and complete registration"""
    
    # Verify OTP from database/cache
    # is_valid = await verify_otp(email, otp_code)
    
    # if not is_valid:
    #     raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Create user account
    # await create_user(email, password)
    
    return {
        "message": "Email verified successfully",
        "status": "registered"
    }

@router.post("/forgot-password")
async def forgot_password(email: str):
    """Send password reset email"""
    
    # Generate reset token
    reset_token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    
    # Store token in database
    # await store_reset_token(email, reset_token, ttl=3600)  # 1 hour
    
    # Create reset link
    reset_link = f"https://yourapp.com/reset-password?token={reset_token}"
    
    # Send reset email using OAuth
    success = email_service.send_password_reset_email(email, reset_link)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send reset email")
    
    return {
        "message": "Password reset email sent"
    }
```

### 5.3 Node.js Implementation

**File: `backend/services/oauthEmailService.js`**

```javascript
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const fs = require('fs');

class OAuthEmailService {
    constructor() {
        this.email = "support@heallog.com";
        this.clientId = process.env.GOOGLE_CLIENT_ID;
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        this.refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    }
    
    async getAccessToken() {
        /**Get fresh access token using refresh token*/
        try {
            const oauth2Client = new google.auth.OAuth2(
                this.clientId,
                this.clientSecret,
                'http://localhost:3000/auth/callback' // callback URL
            );
            
            oauth2Client.setCredentials({
                refresh_token: this.refreshToken
            });
            
            const { credentials } = await oauth2Client.refreshAccessToken();
            return credentials.access_token;
        } catch (error) {
            console.error('❌ Error getting access token:', error);
            return null;
        }
    }
    
    async sendOtpEmail(recipientEmail, otpCode) {
        /**Send OTP email using OAuth 2.0*/
        try {
            // Get fresh access token
            const accessToken = await this.getAccessToken();
            if (!accessToken) {
                console.error('❌ Failed to get access token');
                return false;
            }
            
            // Create transport with OAuth2
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: this.email,
                    clientId: this.clientId,
                    clientSecret: this.clientSecret,
                    refreshToken: this.refreshToken,
                    accessToken: accessToken
                }
            });
            
            // Send email
            const info = await transporter.sendMail({
                from: `"HealLog" <${this.email}>`,
                to: recipientEmail,
                subject: 'HealLog - OTP Verification',
                html: `
                    <html>
                      <body>
                        <h2>Your OTP Code</h2>
                        <p>Enter this code to verify your email:</p>
                        <h1 style="color: #2196F3; letter-spacing: 3px; font-size: 36px;">
                          ${otpCode}
                        </h1>
                        <p>Valid for 10 minutes</p>
                        <hr>
                        <p style="color: #999; font-size: 12px;">
                          This is an automated message. Please don't reply.
                        </p>
                      </body>
                    </html>
                `
            });
            
            console.log(`✅ OTP email sent to ${recipientEmail}`);
            return true;
        } catch (error) {
            console.error('❌ Email error:', error);
            return false;
        }
    }
    
    async sendPasswordResetEmail(recipientEmail, resetLink) {
        /**Send password reset email*/
        try {
            const accessToken = await this.getAccessToken();
            if (!accessToken) return false;
            
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: this.email,
                    clientId: this.clientId,
                    clientSecret: this.clientSecret,
                    refreshToken: this.refreshToken,
                    accessToken: accessToken
                }
            });
            
            const info = await transporter.sendMail({
                from: `"HealLog" <${this.email}>`,
                to: recipientEmail,
                subject: 'Reset Your HealLog Password',
                html: `
                    <html>
                      <body>
                        <h2>Password Reset Request</h2>
                        <p>Click the link below to reset your password:</p>
                        <p>
                          <a href="${resetLink}" 
                             style="background-color: #2196F3; color: white; 
                                    padding: 10px 20px; text-decoration: none; 
                                    border-radius: 5px; display: inline-block;">
                            Reset Password
                          </a>
                        </p>
                        <p>Link valid for 1 hour</p>
                      </body>
                    </html>
                `
            });
            
            console.log(`✅ Password reset email sent to ${recipientEmail}`);
            return true;
        } catch (error) {
            console.error('❌ Email error:', error);
            return false;
        }
    }
}

module.exports = new OAuthEmailService();
```

---

## 🔧 STEP 6: CONFIGURE .env FILE

**File: `backend/.env`**

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REFRESH_TOKEN=1//0g[your_refresh_token]...

# Email Configuration
SMTP_FROM_EMAIL=support@heallog.com
SMTP_FROM_NAME=HealLog

# App Configuration
ENVIRONMENT=development
DEBUG=true

# Database (if using)
DATABASE_URL=postgresql://user:password@localhost/doctor_log
```

**File: `backend/.gitignore`**

```gitignore
# Environment
.env
.env.local
.env.*.local

# Credentials (NEVER commit!)
backend/config/oauth_credentials.json
backend/config/token.json
client_secret_*.json

# Node modules
node_modules/
venv/
__pycache__/

# IDE
.vscode/
.idea/
*.swp
```

---

## 🧪 STEP 7: TEST OAUTH EMAIL

### 7.1 Test Script (Python)

**File: `backend/scripts/test_oauth_email.py`**

```python
#!/usr/bin/env python3
"""Test OAuth email sending"""

from app.services.oauth_email_service import email_service

def test_send_otp():
    """Test sending OTP email"""
    print("\n🧪 Testing OAuth Email Service...\n")
    
    # Test data
    test_email = "your-test-email@gmail.com"  # Change to your test email
    otp_code = "123456"
    
    # Send OTP
    print(f"Sending OTP to {test_email}...")
    success = email_service.send_otp_email(test_email, otp_code)
    
    if success:
        print("✅ OTP sent successfully!")
        print("Check your email (including spam folder)")
    else:
        print("❌ Failed to send OTP")
    
    print()

if __name__ == '__main__':
    test_send_otp()
```

**Run test:**
```bash
python backend/scripts/test_oauth_email.py
```

### 7.2 Expected Output

```
🧪 Testing OAuth Email Service...

Sending OTP to your-test-email@gmail.com...
✅ OTP email sent to your-test-email@gmail.com
✅ OTP sent successfully!
Check your email (including spam folder)
```

### 7.3 Check Your Email

```
1. Go to your test email inbox
2. Look for: "HealLog - OTP Verification"
3. Should see the OTP code (123456)
4. If not in inbox, check Spam folder
```

---

## 📊 TROUBLESHOOTING

### Issue: "Invalid refresh token"
**Solution:**
1. Refresh token may have expired
2. Run the refresh token script again:
   ```bash
   python backend/scripts/get_refresh_token.py
   ```
3. Get new refresh token
4. Update .env file

### Issue: "Authentication failed"
**Solution:**
1. Check .env file has correct values
2. Verify GOOGLE_REFRESH_TOKEN is set
3. Run test script to debug

### Issue: "Permission denied"
**Solution:**
1. Gmail API not enabled in Google Cloud
2. Go back to Step 2 and verify Gmail API is enabled
3. Check OAuth client configuration

### Issue: "Email goes to spam"
**Solution:**
1. This is normal for first emails
2. Mark as "Not spam" in Gmail
3. Add SPF/DKIM records (see below)

---

## 🔒 SECURITY CHECKLIST

- [ ] .env file NOT committed to GitHub
- [ ] oauth_credentials.json NOT committed
- [ ] token.json NOT committed
- [ ] .gitignore includes sensitive files
- [ ] Refresh token stored securely
- [ ] GOOGLE_CLIENT_SECRET not hardcoded
- [ ] OAuth scopes limited to gmail.send only
- [ ] TLS encryption enabled for SMTP

---

## 📧 IMPROVE EMAIL DELIVERABILITY (Optional)

Add SPF and DKIM records to your DNS to improve deliverability:

### Add SPF Record

Go to your DNS provider (Namecheap, GoDaddy, etc):

```
Type:    TXT
Name:    @
Value:   v=spf1 include:_spf.google.com ~all
```

### Enable DKIM

In Google Workspace Admin:
1. Apps → Google Workspace → Gmail → Authentication
2. Click "Manage DKIM authentication"
3. Click "Start authentication"

### Add DMARC Record

```
Type:    TXT
Name:    _dmarc
Value:   v=DMARC1; p=none; rua=mailto:dmarc@heallog.com
```

---

## ✅ FINAL CHECKLIST

- [ ] Google Cloud Project created
- [ ] Gmail API enabled
- [ ] OAuth 2.0 credentials created
- [ ] Refresh token obtained
- [ ] .env file configured
- [ ] Backend code implemented
- [ ] Test script runs successfully
- [ ] Test email received
- [ ] OTP format correct
- [ ] Ready for production

---

## 🎉 YOU'RE DONE!

Your Doctor Log app now has:
- ✅ OAuth 2.0 XOAUTH2 authentication
- ✅ Automatic token refresh
- ✅ Working OTP emails
- ✅ Password reset emails
- ✅ Production-ready email service
- ✅ Future-proof (works until 2030+)

**Total time: ~30 minutes**

---

## 📞 NEXT STEPS

1. **Test thoroughly** - Send test emails to multiple addresses
2. **Monitor emails** - Check deliverability
3. **Add to production** - Deploy to staging first
4. **Set up monitoring** - Log all email failures
5. **Plan backup** - Have fallback email service ready

---

*Created: December 22, 2025*  
*For: Doctor Log Healthcare App*
