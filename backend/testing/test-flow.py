import requests
import json
import time

# API Endpoints
UPLOAD_API = "https://8ived836pl.execute-api.ap-south-1.amazonaws.com/Prod/generate-upload-url"
QA_API = "https://8ived836pl.execute-api.ap-south-1.amazonaws.com/Prod/qa"
SUMMARIZE_API = "https://8ived836pl.execute-api.ap-south-1.amazonaws.com/Prod/summarize"

def test_upload_api():
    """Test the upload URL generation"""
    print("🔍 Testing Upload API...")
    
    payload = {
        "fileName": "test-document.pdf",
        "fileType": "application/pdf",
        "fileSize": 1024000
    }
    
    response = requests.post(UPLOAD_API, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Upload API working!")
        print(f"   Upload URL: {data.get('uploadUrl', 'N/A')}")
        print(f"   File Key: {data.get('fileKey', 'N/A')}")
        return data.get('fileKey')
    else:
        print(f"❌ Upload API failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def test_qa_api(file_key):
    """Test the Q&A API"""
    print("\n🔍 Testing Q&A API...")
    
    payload = {
        "file_key": file_key,
        "question": "What is this document about?"
    }
    
    response = requests.post(QA_API, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Q&A API working!")
        print(f"   Answer: {data.get('answer', 'N/A')}")
        return True
    else:
        print(f"❌ Q&A API failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_summarize_api(file_key):
    """Test the Summarize API"""
    print("\n🔍 Testing Summarize API...")
    
    params = {
        "file_key": file_key
    }
    
    response = requests.get(SUMMARIZE_API, params=params)
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Summarize API working!")
        print(f"   Summary: {data.get('summary', 'N/A')}")
        return True
    else:
        print(f"❌ Summarize API failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_manual_embedding(file_key):
    """Test manual embedding trigger"""
    print("\n🔍 Testing Manual Embedding...")
    
    # This would be the embed API if we had it
    # For now, we'll simulate the process
    print("ℹ️  Manual embedding would be triggered here")
    print("   (This would create vectors for the uploaded file)")
    return True

def main():
    print("🚀 Testing Anvita AI Pipeline")
    print("=" * 50)
    
    # Test 1: Upload API
    file_key = test_upload_api()
    
    if file_key:
        # Test 2: Manual Embedding (simulated)
        test_manual_embedding(file_key)
        
        # Test 3: Q&A API
        test_qa_api(file_key)
        
        # Test 4: Summarize API
        test_summarize_api(file_key)
    
    print("\n" + "=" * 50)
    print("✅ Testing Complete!")

if __name__ == "__main__":
    main() 