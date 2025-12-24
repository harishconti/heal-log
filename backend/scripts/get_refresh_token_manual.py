#!/usr/bin/env python3
"""
MANUAL OAuth 2.0 Refresh Token Generator for HealLog
This version doesn't require a local server - you manually copy the auth code.
"""

import os
import sys
import json
import urllib.parse

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests

# Path to your downloaded credentials JSON
CREDENTIALS_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'config',
    'oauth_credentials.json'
)

# Scopes needed
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def get_refresh_token_manual():
    """Get refresh token using manual code exchange"""
    
    if not os.path.exists(CREDENTIALS_FILE):
        print(f"❌ Credentials file not found: {CREDENTIALS_FILE}")
        return
    
    # Load credentials
    with open(CREDENTIALS_FILE, 'r') as f:
        creds_data = json.load(f)
    
    web_data = creds_data.get('web', creds_data)
    client_id = web_data['client_id']
    client_secret = web_data['client_secret']
    
    # Use out-of-band redirect for manual flow
    redirect_uri = "urn:ietf:wg:oauth:2.0:oob"
    
    # Build authorization URL
    auth_params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': ' '.join(SCOPES),
        'access_type': 'offline',
        'prompt': 'consent',
        'login_hint': 'support@heallog.com'
    }
    
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(auth_params)
    
    print("\n" + "="*60)
    print("🔐 OAuth 2.0 Manual Authentication")
    print("="*60)
    print("\n📋 STEP 1: Open this URL in your browser:")
    print("-"*60)
    print(auth_url)
    print("-"*60)
    print("\n📋 STEP 2: Sign in with support@heallog.com")
    print("📋 STEP 3: Grant permission to send email")
    print("📋 STEP 4: Copy the authorization code shown on screen")
    print("\n" + "="*60)
    
    # Get the authorization code from user
    auth_code = input("\n🔑 Paste the authorization code here: ").strip()
    
    if not auth_code:
        print("❌ No authorization code provided!")
        return
    
    # Exchange authorization code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        'client_id': client_id,
        'client_secret': client_secret,
        'code': auth_code,
        'grant_type': 'authorization_code',
        'redirect_uri': redirect_uri
    }
    
    print("\n⏳ Exchanging code for tokens...")
    
    try:
        response = requests.post(token_url, data=token_data)
        
        if response.status_code == 200:
            tokens = response.json()
            refresh_token = tokens.get('refresh_token')
            access_token = tokens.get('access_token')
            
            print("\n" + "="*60)
            print("✅ SUCCESS! TOKENS OBTAINED!")
            print("="*60)
            print(f"\n📧 Refresh Token:\n{refresh_token}")
            print("\n⚠️  ADD THIS TO YOUR .env FILE:")
            print(f"GOOGLE_REFRESH_TOKEN={refresh_token}")
            print("="*60)
            
            # Save tokens to file
            token_file = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                'config',
                'token.json'
            )
            
            token_save_data = {
                'refresh_token': refresh_token,
                'access_token': access_token,
                'client_id': client_id,
                'client_secret': client_secret
            }
            
            with open(token_file, 'w') as f:
                json.dump(token_save_data, f, indent=2)
            
            print(f"\n✅ Tokens saved to: {token_file}")
            return refresh_token
            
        else:
            print(f"\n❌ Error exchanging code: {response.status_code}")
            print(response.text)
            return None
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return None

if __name__ == '__main__':
    print("\n🔐 OAuth 2.0 Manual Flow (No Server Required)")
    print("="*50 + "\n")
    get_refresh_token_manual()
