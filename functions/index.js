const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google-ai/generativelanguage");

// --- ĐỊNH NGHĨA CÁC SECRET SẼ SỬ DỤNG ---
const serviceAccountKeySecret = functions.params.defineSecret("SERVICEACCOUNT_KEY_BASE64");
const geminiApiKeySecret = functions.params.defineSecret("GEMINI_API_KEY");

let isAppInitialized = false;

function initializeFirebaseApp(serviceAccountKeyBase64) {
    if (isAppInitialized) return;
    try {
        const serviceAccountString = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(serviceAccountString);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("Firebase Admin SDK initialized successfully.");
        isAppInitialized = true;
    } catch (error) {
        console.error("CRITICAL: Failed to initialize Firebase Admin SDK.", error);
    }
}

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

// --- ĐỊNH NGHĨA CÁC ĐƯỜNG DẪN (ROUTES) CHO API ---

// Route ví dụ: /hello
app.get("/hello", (req, res) => {
    res.status(200).send("Hello from IVS Backend API!");
});

// Route để lấy danh sách người dùng (ví dụ)
app.get("/users", async (req, res) => {
    if (!isAppInitialized) return res.status(500).send("Admin SDK is not initialized.");
    try {
        const listUsersResult = await admin.auth().listUsers(100);
        const users = listUsersResult.users.map(user => ({
            uid: user.uid, email: user.email, displayName: user.displayName
        }));
        return res.status(200).json(users);
    } catch (error) {
        console.error("Error listing users:", error);
        return res.status(500).send("Error fetching user list.");
    }
});

// *** ROUTE MỚI CHO CHATBOT AI ***
app.post("/chat", async (req, res) => {
    // Lấy API key từ secret đã được nạp
    const GEMINI_API_KEY = geminiApiKeySecret.value();
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
    }

    try {
        const { history, message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const chat = model.startChat({
            history: history || [],
            generationConfig: { maxOutputTokens: 1500 },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ success: true, response: text });

    } catch (error) {
        console.error("Error in /chat route:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});


// --- XUẤT CLOUD FUNCTION CHÍNH ---
exports.api = functions.https.onRequest(
    {
        region: "asia-southeast1", // Đổi sang Singapore để giảm độ trễ
        secrets: [serviceAccountKeySecret, geminiApiKeySecret],
    },
    (req, res) => {
        initializeFirebaseApp(serviceAccountKeySecret.value());
        return app(req, res);
    }
);
