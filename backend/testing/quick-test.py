import requests
import json

# Test the upload flow
def test_upload_flow():
    print("🚀 Testing Upload Flow")
    print("=" * 40)
    
    # Step 1: Generate upload URL
    print("1. Generating upload URL...")
    response = requests.post(
        "https://8ived836pl.execute-api.ap-south-1.amazonaws.com/Prod/generate-upload-url",
        json={
            "fileName": "example.pdf",
            "fileType": "application/pdf", 
            "fileSize": 1024000
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        file_key = data.get('fileKey')
        upload_url = data.get('uploadUrl')
        
        print(f"✅ Upload URL generated!")
        print(f"   File Key: {file_key}")
        print(f"   Upload URL: {upload_url[:50]}...")
        
        # Step 2: Test Q&A with the file key
        print("\n2. Testing Q&A API...")
        qa_response = requests.post(
            "https://8ived836pl.execute-api.ap-south-1.amazonaws.com/Prod/qa",
            json={
                "file_key": file_key,
                "question": "What is this document about?"
            }
        )
        
        if qa_response.status_code == 200:
            print("✅ Q&A API working!")
        else:
            print(f"❌ Q&A API failed: {qa_response.status_code}")
            print(f"   Response: {qa_response.text}")
        
        # Step 3: Test Summarize
        print("\n3. Testing Summarize API...")
        summary_response = requests.get(
            f"https://8ived836pl.execute-api.ap-south-1.amazonaws.com/Prod/summarize?file_key={file_key}"
        )
        
        if summary_response.status_code == 200:
            print("✅ Summarize API working!")
        else:
            print(f"❌ Summarize API failed: {summary_response.status_code}")
            print(f"   Response: {summary_response.text}")
            
    else:
        print(f"❌ Upload URL generation failed: {response.status_code}")
        print(f"   Response: {response.text}")

if __name__ == "__main__":
    test_upload_flow() 