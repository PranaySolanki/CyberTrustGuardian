require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const express = require('express');
const multer = require('multer');
const ApkParser = require('node-apk-parser');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_KEY_HERE");

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

/**
 * POST /analyze-context
 * Evaluates app purpose vs permissions using Gemini.
 */
app.post('/analyze-context', async (req, res) => {
  const { appName, packageName, permissions } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not found. Skipping contextual analysis.");
    return res.json({ modifier: 1.0, verdict: 'SKIPPED', reason: 'No API Key' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      App Name: ${appName}
      Package: ${packageName}
      Permissions: ${permissions.join(', ')}

      Analyze if these permissions are reasonable for this app's purpose. 
      Return JSON only: {"verdict": "SECURE" | "SUSPICIOUS" | "MALICIOUS", "modifier": 0.5 | 1.0 | 1.5, "explanation": "short text"}
      - SECURE: Permissions are normal for such an app.
      - SUSPICIOUS: Permissions seem excessive or unrelated.
      - MALICIOUS: Permissions are definitely for spying or data theft.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean JSON from backticks if any
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(jsonStr);

    res.json(analysis);
  } catch (error) {
    console.error('Gemini error:', error);
    res.json({ modifier: 1.0, verdict: 'ERROR', reason: error.message });
  }
});

/**
 * POST /upload
 * Parses an uploaded APK file and returns its package name and permissions.
 */
app.post('/upload', upload.single('apk'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const filePath = req.file.path;

  try {
    const reader = ApkParser.readFile(filePath);
    const manifest = reader.readManifestSync();

    let permissions = manifest.usesPermissions || [];
    if (permissions.length > 0 && typeof permissions[0] === 'object') {
      permissions = permissions.map(p => p.name);
    }

    const packageName = manifest.package || 'Unknown Package';

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ package_name: packageName, permissions });
  } catch (error) {
    console.error('Error parsing APK:', error);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }
    res.status(500).json({ error: 'Failed to parse APK file.' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`APK Backend listening at http://0.0.0.0:${port}`);
});
