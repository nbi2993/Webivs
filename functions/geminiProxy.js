const functions = require('firebase-functions');
const fetch = require('node-fetch'); // Nếu chưa có, hãy cài đặt: npm install node-fetch

// Đặt API key Gemini của bạn ở biến môi trường (không hardcode)
const GEMINI_API_KEY = functions.config().gemini.key;

exports.geminiProxy = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});