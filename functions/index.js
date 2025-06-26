// functions/index.js (Đây là file sẽ được triển khai lên Firebase Functions)
// Mã này thay thế nội dung của server.js cũ và điều chỉnh cho môi trường Functions.

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const cors = require("cors"); // Thêm cors để xử lý Cross-Origin Resource Sharing

const app = express();

// Sử dụng middleware cors. `origin: true` cho phép mọi nguồn,
// trong production bạn nên giới hạn chỉ tên miền frontend của mình.
app.use(cors({ origin: true }));
app.use(bodyParser.json());

// ====================================================================
// KHỞI TẠO FIREBASE ADMIN SDK (Sử dụng biến môi trường an toàn)
// ====================================================================
try {
    // Đọc Service Account Key đã mã hóa Base64 từ cấu hình Functions
    const serviceAccountBase64 = functions.config().serviceaccount?.key_base64;

    if (!serviceAccountBase64) {
        console.error("FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is not defined in Firebase Functions config.");
        // Trong môi trường Production, bạn có thể muốn thoát hoặc báo lỗi rõ ràng hơn.
        // Ở đây, chúng ta sẽ cho phép tiếp tục để các lỗi khác được xử lý, nhưng chức năng Firebase sẽ lỗi.
    } else {
        // Giải mã Base64 và parse JSON
        const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('ascii'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://ivsjsc-6362f-default-rtdb.asia-southeast1.firebasedatabase.app"
        });
        console.log("[Firebase Admin] Firebase Admin SDK đã được khởi tạo thành công.");
    }
} catch (error) {
    console.error("[Firebase Admin] Lỗi khi khởi tạo Firebase Admin SDK:", error.message);
    console.error("Vui lòng đảm bảo FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 được cấu hình đúng.");
    // Không thoát process.exit(1) trong Functions để hàm vẫn có thể phản hồi lỗi HTTP
}


// ====================================================================
// ENDPOINT CHO CHATBOT AI (Proxy cho Gemini API)
// ====================================================================
app.post('/api/chat', async (req, res) => {
    try {
        const chatHistory = req.body.contents; // Lấy lịch sử trò chuyện từ frontend
        // Lấy Gemini API Key từ cấu hình Functions
        const geminiApiKey = functions.config().gemini?.key;

        if (!geminiApiKey) {
            console.error("GEMINI_API_KEY không được định nghĩa trong cấu hình Firebase Functions.");
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

// Lưu ý: Các endpoint này cần Firebase Admin SDK đã khởi tạo thành công
// Endpoint đăng ký người dùng
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!admin.apps.length) { // Kiểm tra nếu Admin SDK chưa khởi tạo
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

// Endpoint đăng nhập người dùng (Tạo Custom Token)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!admin.apps.length) {
            return res.status(500).json({ error: "Firebase Admin SDK chưa khởi tạo. Vui lòng kiểm tra cấu hình server." });
        }
        // Lưu ý: Phương pháp này không xác thực mật khẩu. Client nên gửi ID Token sau khi đăng nhập.
        const user = await admin.auth().getUserByEmail(email);
        const customToken = await admin.auth().createCustomToken(user.uid);
        res.status(200).json({ message: 'Đăng nhập thành công!', customToken: customToken });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error.code);
        let errorMessage = "Đăng nhập không thành công. Vui lòng kiểm tra lại Email/Mật khẩu.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') { // wrong-password không áp dụng trực tiếp cho getUserByEmail
            errorMessage = "Email không đúng hoặc không tồn tại.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Email không hợp lệ.";
        }
        res.status(401).json({ error: errorMessage });
    }
});

// Endpoint bảo vệ ví dụ (Xác minh ID Token)
app.get('/api/protected', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    if (!idToken) {
        return res.status(401).json({ error: "Không có token xác thực." });
    }

    try {
        if (!admin.apps.length) {
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


// Xuất ứng dụng Express dưới dạng một Firebase Function
// Tên function sẽ là 'api' và có thể truy cập qua URL Firebase Functions
exports.api = functions.https.onRequest(app);
