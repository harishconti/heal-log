#!/usr/bin/env python3
"""
Get OAuth 2.0 refresh token for HealLog
Run this ONCE to generate the refresh token
"""

import json
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from google_auth_oauthlib.flow import InstalledAppFlow

# Path to your downloaded credentials JSON
CREDENTIALS_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'config',
    'oauth_credentials.json'
)

# Scopes needed
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def get_refresh_token():
    """Get refresh token"""
    
    if not os.path.exists(CREDENTIALS_FILE):
        print(f"❌ Credentials file not found: {CREDENTIALS_FILE}")
        return
    
    print(f"📁 Using credentials from: {CREDENTIALS_FILE}")
    print("\n🌐 Opening browser for authentication...")
    print("Please sign in with: support@heallog.com\n")
    
    # Create flow from client secrets file
    flow = InstalledAppFlow.from_client_secrets_file(
        CREDENTIALS_FILE,
        scopes=SCOPES
    )
    
    # Run local server - THIS OPENS BROWSER AUTOMATICALLY
    creds = flow.run_local_server(port=8080)
    
    print("\n" + "="*60)
    print("✅ REFRESH TOKEN OBTAINED!")
    print("="*60)
    print(f"\nRefresh Token:\n{creds.refresh_token}")
    print("\n⚠️  ADD THIS TO YOUR .env FILE:")
    print(f"GOOGLE_REFRESH_TOKEN={creds.refresh_token}")
    print("="*60 + "\n")
    
    # Save to file for backup
    token_data = {
        'refresh_token': creds.refresh_token,
        'client_id': creds.client_id,
        'client_secret': creds.client_secret,
    }
    
    token_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'config',
        'token.json'
    )
    
    with open(token_file, 'w') as f:
        json.dump(token_data, f, indent=2)
    
    print(f"✅ Token also saved to: {token_file}\n")

if __name__ == '__main__':
    print("\n🔐 OAuth 2.0 Refresh Token Generator")
    print("="*40 + "\n")
    get_refresh_token()
