from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import os
import logging

# 1. SILENCE ANDROGUARD DEBUG LOGS (Speeds up processing)
logging.getLogger("androguard").setLevel(logging.ERROR)

try:
    from androguard.core.apk import APK
except ImportError:
    from androguard.core.bytecodes.apk import APK

app = Flask(__name__)
CORS(app)

# Common patterns for static analysis
PATTERNS = {
    "Google_API_Key": r"AIza[0-9A-Za-z-_]{35}",
    "URL": r"https?://[^\s\"<>]+",
    "AWS_Key": r"AKIA[0-9A-Z]{16}",
    "Firebase_URL": r"https://[a-zA-Z0-9-]+\.firebaseio\.com"
}

@app.route('/analyze', methods=['POST'])
def analyze_apk():
    print("--- 🚀 Scan Request Received ---")
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    file_path = "temp.apk"
    file.save(file_path)

    try:
        # 2. LOAD APK (This is the heavy part)
        a = APK(file_path)
        
        package_name = a.get_package()
        permissions = list(a.get_permissions())
        
        # 3. STATIC ANALYSIS FOR SECRETS (In Manifest and DEX strings)
        results = {key: [] for key in PATTERNS}
        
        # Scan Manifest
        manifest_str = str(a.get_android_manifest_xml())
        
        # Scan all string resources and internal strings
        # This is more efficient than scanning line-by-line
        all_strings = " ".join(a.get_files()) + manifest_str
        
        for name, pattern in PATTERNS.items():
            matches = re.findall(pattern, all_strings)
            results[name] = list(set(matches)) # Unique matches only

        print(f"✅ Analysis Complete: {package_name}")
        
        return jsonify({
            "package_name": package_name,
            "permissions": permissions,
            "secrets": results,
            "version": a.get_version_name() if hasattr(a, 'get_version_name') else "1.0"
        })

    except Exception as e:
        print(f"❌ Analysis Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        # 4. CLEANUP
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == '__main__':
    # Use your actual IP address here
    app.run(host='0.0.0.0', port=5000)