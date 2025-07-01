// File: index.js (hoặc file gốc của anh)
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google-ai/generativelanguage");

// --- KHỞI TẠO FIREBASE ADMIN SDK ---
// App Hosting sẽ tự động cung cấp thông tin credentials, không cần key file.
try {
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized successfully in the App Hosting environment.");
} catch (error) {
    console.error("CRITICAL: Failed to initialize Firebase Admin SDK.", error);
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// *** ROUTE CHO CHATBOT AI ***
app.post("/chat", async (req, res) => {
    // Trong App Hosting, secret được truy cập qua process.env
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
    if (!GEMINI_API_KEY) {
        console.error("Gemini API Key is not available in environment variables.");
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

// --- KHỞI ĐỘNG SERVER ---
// GIẢI PHÁP: Lấy port từ biến môi trường của App Hosting.
// Nếu không có (khi chạy ở local), dùng một port mặc định (ví dụ: 8080).
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

// --- XUẤT APP ĐỂ FIREBASE CÓ THỂ SỬ DỤNG (TÙY CHỌN, NHƯNG NÊN CÓ) ---
module.exports = app;
