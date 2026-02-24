const express = require('express');
const multer = require('multer');
const ApkParser = require('node-apk-parser');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

/**
 * POST /upload
 * Parses an uploaded APK file and returns its package name and permissions.
 * ML analysis is now done on-device via TFLite — this endpoint only extracts data.
 */
app.post('/upload', upload.single('apk'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const filePath = req.file.path;

  try {
    const reader = ApkParser.readFile(filePath);
    const manifest = reader.readManifestSync();

    // Normalize permissions to an array of strings
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
