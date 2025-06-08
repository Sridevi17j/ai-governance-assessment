# Token.pickle to JSON Conversion Instructions

## Converting Python token.pickle to JSON for Node.js

Since your `token.pickle` file is in Python pickle format, we need to convert it to JSON for Node.js to read it.

### Option 1: Python Script to Convert

Create a Python script to convert your existing token.pickle to JSON:

```python
# convert_token.py
import pickle
import json

def convert_token_pickle_to_json():
    try:
        # Load the existing token.pickle
        with open('token.pickle', 'rb') as token_file:
            creds = pickle.load(token_file)
        
        # Extract token information
        token_data = {
            'access_token': creds.token,
            'refresh_token': creds.refresh_token,
            'token_uri': creds.token_uri,
            'client_id': creds.client_id,
            'client_secret': creds.client_secret,
            'scopes': creds.scopes,
            'expiry': creds.expiry.isoformat() if creds.expiry else None
        }
        
        # Save as JSON
        with open('token.json', 'w') as json_file:
            json.dump(token_data, json_file, indent=2)
        
        print("✅ Successfully converted token.pickle to token.json")
        print("📁 Place the token.json file in your project root directory")
        
    except Exception as e:
        print(f"❌ Error converting token: {e}")

if __name__ == "__main__":
    convert_token_pickle_to_json()
```

**Run this script:**
```bash
python convert_token.py
```

### Option 2: Manual Token Creation

If conversion doesn't work, create a new token.json file manually:

```json
{
  "access_token": "your-access-token",
  "refresh_token": "your-refresh-token", 
  "token_uri": "https://oauth2.googleapis.com/token",
  "client_id": "your-gmail-client-id",
  "client_secret": "your-gmail-client-secret",
  "scopes": ["https://www.googleapis.com/auth/gmail.send"]
}
```

### Option 3: Use Your Existing Python Code

Add this to your existing Python email code to extract tokens:

```python
# Add this to your existing Python script
def export_tokens_to_json():
    import pickle
    import json
    
    with open('token.pickle', 'rb') as token:
        creds = pickle.load(token)
    
    token_dict = {
        'access_token': creds.token,
        'refresh_token': creds.refresh_token,
        'token_uri': 'https://oauth2.googleapis.com/token',
        'client_id': creds.client_id,
        'client_secret': creds.client_secret,
        'scopes': ['https://www.googleapis.com/auth/gmail.send']
    }
    
    with open('token.json', 'w') as f:
        json.dump(token_dict, f, indent=2)
    
    print("Token exported to token.json")

# Call this function once
export_tokens_to_json()
```

## File Placement

Once you have `token.json`, place it in:
```
ai-governance-assessment/
├── token.json  ← Place here (project root)
├── apps/
├── data/
└── ...
```

## Update API Code

The API code will automatically look for `token.json` instead of `token.pickle` if the conversion is successful.

## Security Note

⚠️ **Important**: Never commit `token.json` to version control. Add it to `.gitignore`:

```gitignore
# Add to .gitignore
token.json
token.pickle
*.json
```

## Testing

After placing `token.json` in the root directory:
1. Install dependencies: `npm run setup`
2. Start the app: `npm run dev`  
3. Complete an assessment
4. Click "Email to Manager" button
5. Check for success message

## Troubleshooting

**If you get authentication errors:**
1. Check that `token.json` is in the project root
2. Verify the refresh_token is valid
3. Ensure Gmail API is enabled in your Google Cloud project
4. Check that your OAuth2 consent screen is configured

**Need to regenerate tokens?**
Run your original Python authentication flow to create a fresh `token.pickle`, then convert it again.
