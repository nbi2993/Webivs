// server.js (hoặc app.js)
require('dotenv').config({ path: '../secrets/.env' });
const admin = require('firebase-admin'); // Import Firebase Admin SDK
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');

// Rate limiter middleware
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

const app = express();
const PORT = process.env.PORT || 3000;

// ====================================================================
// KHỞI TẠO FIREBASE ADMIN SDK
// ====================================================================
// Đảm bảo tệp serviceAccountKey.json nằm trong thư mục secrets
try {
    const serviceAccount = require('../secrets/serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("[Firebase Admin] Firebase Admin SDK đã được khởi tạo thành công.");
} catch (error) {
    console.error("[Firebase Admin] Lỗi khi khởi tạo Firebase Admin SDK:", error.message);
    console.error("Vui lòng đảm bảo tệp '../secrets/serviceAccountKey.json' nằm đúng vị trí và có định dạng hợp lệ.");
    process.exit(1); // Thoát ứng dụng nếu Admin SDK không khởi tạo được
}

// Middleware để phân tích body của request
app.use(bodyParser.json());

// Phục vụ các file tĩnh (HTML, CSS, JS của frontend)
// Đảm bảo thư mục 'public' chứa index.html, auth.html và các tài nguyên frontend khác
app.use(express.static('public'));

// ====================================================================
// ENDPOINT CHO CHATBOT AI
// ====================================================================
app.post('/api/chat', async (req, res) => {
    try {
        const chatHistory = req.body.contents; // Lấy lịch sử trò chuyện từ frontend
        const geminiApiKey = process.env.GEMINI_API_KEY; // Lấy API Key từ biến môi trường

        if (!geminiApiKey) {
            console.error("GEMINI_API_KEY không được định nghĩa trong biến môi trường.");
            return res.status(500).json({ error: "Server configuration error: API Key missing." });
        }

        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

        const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: chatHistory })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Lỗi từ Gemini API:", errorData);
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

// ====================================================================
// ENDPOINT CHO XÁC THỰC FIREBASE (Authentication)
// ====================================================================

// Endpoint đăng ký người dùng
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });
        // Tạo Custom Token cho người dùng mới
        const customToken = await admin.auth().createCustomToken(userRecord.uid);
        res.status(201).json({ message: 'Đăng ký thành công!', customToken: customToken });
    } catch (error) {
        console.error("Lỗi đăng ký:", error.code);
        let errorMessage = "Đăng ký không thành công. Vui lòng thử lại.";
        if (error.code === 'auth/email-already-exists') {
            errorMessage = "Email này đã được đăng ký.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Email không hợp lệ.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "Mật khẩu quá yếu (tối thiểu 6 ký tự).";
        }
        res.status(400).json({ error: errorMessage });
    }
});

// Endpoint đăng nhập người dùng
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Firebase Admin SDK không có hàm signInWithEmailAndPassword trực tiếp
        // Thay vào đó, chúng ta có thể tạo custom token và gửi về client để client tự đăng nhập
        // Hoặc xác thực email/password qua Firebase Client SDK, sau đó gửi ID Token lên đây
        // Phương pháp phổ biến hơn là Client SDK tự đăng nhập và gửi ID Token lên backend để xác minh.

        // Ví dụ này giả định client đã xác thực email/password và gửi ID Token lên
        // Nếu bạn muốn backend tự xác thực email/password, bạn cần một cơ chế khác
        // Tuy nhiên, việc tạo userRecord từ email/password ở đây chỉ dùng để tạo custom token
        // cho mục đích đơn giản hóa ví dụ. Trong thực tế, client nên gửi ID Token sau khi đăng nhập.
        const user = await admin.auth().getUserByEmail(email);
        // Đây không phải là cách an toàn để xác thực mật khẩu.
        // Chỉ dùng để tạo custom token cho người dùng đã tồn tại.
        const customToken = await admin.auth().createCustomToken(user.uid);
        res.status(200).json({ message: 'Đăng nhập thành công!', customToken: customToken });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error.code);
        let errorMessage = "Đăng nhập không thành công. Vui lòng kiểm tra lại Email/Mật khẩu.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = "Email hoặc mật khẩu không đúng.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Email không hợp lệ.";
        }
        res.status(401).json({ error: errorMessage });
    }
});

// Endpoint bảo vệ ví dụ (chỉ truy cập được khi đã đăng nhập)
app.get('/api/protected', async (req, res) => {
    // Lấy ID Token từ header Authorization (Bearer Token)
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    if (!idToken) {
        return res.status(401).json({ error: "Không có token xác thực." });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        res.status(200).json({ message: `Dữ liệu được bảo vệ cho người dùng: ${uid}`, data: "Đây là dữ liệu chỉ dành cho người dùng đã xác thực." });
    } catch (error) {
        console.error("Lỗi xác thực token:", error.message);
        res.status(403).json({ error: "Token không hợp lệ hoặc đã hết hạn." });
    }
});


// Khởi chạy server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
    console.log("Đảm bảo GEMINI_API_KEY và tệp serviceAccountKey.json được đặt đúng vị trí.");
});
