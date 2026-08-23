const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// We get the API key from functions config or env
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || 'MISSING_KEY';

app.all('*', async (req, res) => {
  try {
    // 1. Verify Authentication
    // In a real app we would use Firebase Admin to verify req.headers.authorization
    // For now we just check if it exists (simulating the check)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Construct Gemini URL
    // e.g. req.originalUrl is /geminiProxy/v1beta/models/gemini-1.5-flash:generateContent
    // We want to hit https://generativelanguage.googleapis.com/v1beta/...
    // Remove the function name from the path if it exists
    const path = req.path.replace(/^\/geminiProxy/, ''); 
    const url = `https://generativelanguage.googleapis.com${path}?key=${GEMINI_API_KEY}`;

    // 3. Proxy Request
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    // 4. Stream response back
    res.status(response.status);
    response.headers.forEach((val, key) => res.setHeader(key, val));
    
    if (response.body) {
      // In Node 18+, response.body is a ReadableStream
      for await (const chunk of response.body) {
        res.write(chunk);
      }
      res.end();
    } else {
      res.send(await response.text());
    }
  } catch (error) {
    console.error("Proxy error", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

exports.geminiProxy = functions.https.onRequest(app);
