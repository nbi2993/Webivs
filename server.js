// server.js (hoặc app.js)
require('dotenv').config(); // Đọc biến môi trường từ file .env

const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // Import node-fetch một cách rõ ràng

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware để phân tích body của request
app.use(bodyParser.json());

// Phục vụ các file tĩnh (HTML, CSS, JS của frontend)
app.use(express.static('public')); // Giả sử các file frontend của bạn nằm trong thư mục 'public'

// Endpoint API cho chatbot
app.post('/api/chat', async (req, res) => {
    try {
        const chatHistory = req.body.contents; // Lấy lịch sử trò chuyện từ frontend
        const geminiApiKey = process.env.GEMINI_API_KEY; // Lấy API Key từ biến môi trường

        if (!geminiApiKey) {
            console.error("GEMINI_API_KEY không được định nghĩa trong biến môi trường.");
            return res.status(500).json({ error: "Server configuration error: API Key missing." });
        }

        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

        // Sử dụng 'fetch' được import từ 'node-fetch'
        const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: chatHistory })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Lỗi từ Gemini API:", errorData);
            // Cải thiện thông báo lỗi trả về client
            return res.status(response.status).json({ 
                error: `Lỗi từ Gemini API: ${errorData.error ? errorData.error.message : response.statusText || 'Unknown error'}` 
            });
        }

        const result = await response.json();
        res.json(result); // Gửi phản hồi từ Gemini API về frontend

    } catch (error) {
        console.error("Lỗi khi xử lý yêu cầu chatbot:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
    console.log("Đảm bảo GEMINI_API_KEY được đặt trong biến môi trường.");
});
