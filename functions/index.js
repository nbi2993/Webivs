// functions/index.js (Đây là file sẽ được triển khai lên Firebase Functions)
// Mã này thay thế nội dung của server.js cũ và điều chỉnh cho môi trường Functions.

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch"); // node-fetch là cần thiết cho Node.js 16. Node.js 18+ có global fetch.
const cors = require("cors");

const app = express();

app.use(cors({ origin: true })); // Cho phép CORS từ mọi nguồn. Trong production, hãy giới hạn domain cụ thể.
app.use(bodyParser.json());

// ====================================================================
// KHỞI TẠO FIREBASE ADMIN SDK (Sử dụng biến môi trường an toàn)
// ====================================================================
// Khởi tạo Admin SDK một lần duy nhất nếu chưa được khởi tạo
if (admin.apps.length === 0) {
    try {
        // Đọc Service Account Key đã mã hóa Base64 từ biến môi trường của hệ thống
        const serviceAccountBase64 = process.env.SERVICEACCOUNT_KEY_BASE64; // Tên biến môi trường đã được đặt (functions:config:set serviceaccount.key_base64)
        
        if (!serviceAccountBase64) {
            console.error("Lỗi khởi tạo Admin SDK: Biến SERVICEACCOUNT_KEY_BASE64 không được định nghĩa trong biến môi trường.");
            throw new Error("Missing SERVICEACCOUNT_KEY_BASE64 environment variable.");
        }

        const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('ascii'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://ivsjsc-6362f-default-rtdb.asia-southeast1.firebasedatabase.app"
        });
        console.log("[Firebase Admin] Firebase Admin SDK đã được khởi tạo thành công.");
    } catch (error) {
        console.error("[Firebase Admin] Lỗi khi khởi tạo Firebase Admin SDK:", error.message);
        console.error("Vui lòng đảm bảo SERVICEACCOUNT_KEY_BASE64 được cấu hình đúng và có định dạng JSON hợp lệ sau khi giải mã Base64.");
    }
} else {
    console.log("[Firebase Admin] Firebase Admin SDK đã được khởi tạo trước đó.");
}


// ====================================================================
// ENDPOINT CHO CHATBOT AI (Proxy cho Gemini API)
// ====================================================================
app.post('/api/chat', async (req, res) => {
    try {
        const chatHistory = req.body.contents;
        // Đọc Gemini API Key từ biến môi trường của hệ thống
        const geminiApiKey = process.env.GEMINI_API_KEY; // Tên biến môi trường đã được đặt (functions:config:set gemini.key)

        if (!geminiApiKey) {
            console.error("GEMINI_API_KEY không được định nghĩa trong biến môi trường.");
            return res.status(500).json({ error: "Server configuration error: Gemini API Key missing." });
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
        res.json(result); 

    } catch (error) {
        console.error("Lỗi khi xử lý yêu cầu chatbot:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// ====================================================================
// ENDPOINT CHO XÁC THỰC FIREBASE (Authentication)
// ====================================================================

app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (admin.apps.length === 0) {
            return res.status(500).json({ error: "Firebase Admin SDK chưa khởi tạo. Vui lòng kiểm tra cấu hình server." });
        }
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });
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

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (admin.apps.length === 0) {
            return res.status(500).json({ error: "Firebase Admin SDK chưa khởi tạo. Vui lòng kiểm tra cấu hình server." });
        }
        const user = await admin.auth().getUserByEmail(email);
        const customToken = await admin.auth().createCustomToken(user.uid);
        res.status(200).json({ message: 'Đăng nhập thành công!', customToken: customToken });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error.code);
        let errorMessage = "Đăng nhập không thành công. Vui lòng kiểm tra lại Email/Mật khẩu.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = "Email không đúng hoặc không tồn tại.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Email không hợp lệ.";
        }
        res.status(401).json({ error: errorMessage });
    }
});

app.get('/api/protected', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    if (!idToken) {
        return res.status(401).json({ error: "Không có token xác thực." });
    }

    try {
        if (admin.apps.length === 0) {
            return res.status(500).json({ error: "Firebase Admin SDK chưa khởi tạo. Vui lòng kiểm tra cấu hình server." });
        }
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        res.status(200).json({ message: `Dữ liệu được bảo vệ cho người dùng: ${uid}`, data: "Đây là dữ liệu chỉ dành cho người dùng đã xác thực." });
    } catch (error) {
        console.error("Lỗi xác thực token:", error.message);
        res.status(403).json({ error: "Token không hợp lệ hoặc đã hết hạn." });
    }
});


// Xuất ứng dụng Express dưới dạng một Firebase Function (Functions v2)
// Sử dụng .region và .onRequestHandler để triển khai rõ ràng Functions v2.
exports.api = functions
    .region('us-central1') // Thay đổi 'us-central1' nếu bạn muốn một khu vực khác
    .runWith({
        memory: '256MB', // Tùy chọn: Đặt bộ nhớ cho hàm
        timeoutSeconds: 60 // Tùy chọn: Đặt thời gian timeout cho hàm
    })
    .https.onRequest(app);
