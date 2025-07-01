/* === File: functions/index.js === */
/*
 * Cập nhật:
 * - Thêm middleware `verifyAppCheck` để xác thực token App Check trước khi xử lý.
 * - Áp dụng middleware này cho route /chat để tăng cường bảo mật.
 */

const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google-ai/generativelanguage");

// --- ĐỊNH NGHĨA CÁC SECRET SẼ SỬ DỤNG ---
const serviceAccountKeySecret = functions.params.defineSecret("SERVICEACCOUNT_KEY_BASE64");
const geminiApiKeySecret = functions.params.defineSecret("GEMINI_API_KEY");

let isAppInitialized = false;

function initializeFirebaseApp(serviceAccountKeyBase64) {
    if (isAppInitialized || !serviceAccountKeyBase64) return;
    try {
        const serviceAccountString = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(serviceAccountString);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        console.log("Firebase Admin SDK initialized successfully.");
        isAppInitialized = true;
    } catch (error) {
        console.error("CRITICAL: Failed to initialize Firebase Admin SDK.", error);
    }
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());


// *** MIDDLEWARE BẢO MẬT: XÁC THỰC APP CHECK TOKEN ***
const verifyAppCheck = async (req, res, next) => {
    // Bỏ qua xác thực cho các môi trường test không có App Check
    if (process.env.FUNCTIONS_EMULATOR) {
        return next();
    }
    
    const appCheckToken = req.header("X-Firebase-AppCheck");

    if (!appCheckToken) {
        console.warn("App Check token not found.");
        return res.status(401).send("Unauthorized: App Check token is missing.");
    }

    try {
        // Sử dụng Admin SDK để xác thực token
        await admin.appCheck().verifyToken(appCheckToken);
        // Token hợp lệ, cho phép yêu cầu đi tiếp đến route xử lý chính
        return next();
    } catch (err) {
        console.error("App Check token verification failed:", err);
        return res.status(401).send("Unauthorized: Invalid App Check token.");
    }
};


// *** ROUTE CHO CHATBOT AI - ĐÃ ĐƯỢC BẢO VỆ BỞI APP CHECK ***
// Middleware `verifyAppCheck` được thêm vào trước hàm xử lý chính.
app.post("/chat", verifyAppCheck, async (req, res) => {
    const GEMINI_API_KEY = geminiApiKeySecret.value();
    if (!GEMINI_API_KEY) {
        console.error("Gemini API Key is not available in secrets.");
        return res.status(500).json({ error: "AI service is not configured." });
    }

    try {
        const { history, message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message content is required" });
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const chat = model.startChat({
            history: history || [],
            generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.text();

        res.status(200).json({ success: true, response: text });

    } catch (error) {
        console.error("Error during Gemini API call:", error);
        res.status(500).json({ error: "Failed to get response from AI", details: error.message });
    }
});


// --- XUẤT CLOUD FUNCTION CHÍNH ---
exports.api = functions.https.onRequest(
    {
        region: "asia-southeast1",
        secrets: [serviceAccountKeySecret, geminiApiKeySecret],
        timeoutSeconds: 60,
        // Bật tính năng thực thi App Check cho function này
        enforceAppCheck: true, 
    },
    (req, res) => {
        initializeFirebaseApp(serviceAccountKeySecret.value());
        return app(req, res);
    }
);
