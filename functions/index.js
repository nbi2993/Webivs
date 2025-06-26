// functions/index.js: Mã nguồn backend cho Firebase Functions (thay thế server.js)
// File này sẽ xử lý các yêu cầu API từ frontend của bạn.

const functions = require("firebase-functions"); // Import thư viện Firebase Functions
const admin = require("firebase-admin");       // Import Firebase Admin SDK
const express = require("express");            // Import Express.js để tạo API
const bodyParser = require("body-parser");     // Middleware để phân tích body của request
const fetch = require("node-fetch");           // Dùng để gọi API bên ngoài (như Gemini API)
const cors = require("cors");                  // Middleware để xử lý Cross-Origin Resource Sharing

const app = express();

// Cấu hình CORS: Cho phép mọi nguồn gốc truy cập API của bạn.
// TRONG MÔI TRƯỜNG PRODUCTION, BẠN NÊN GIỚI HẠN CHỈ CHO PHÉP TÊN MIỀN FRONTEND CỦA BẠN.
app.use(cors({ origin: true }));
app.use(bodyParser.json()); // Phân tích body của request dưới dạng JSON

// ====================================================================
// KHỞI TẠO FIREBASE ADMIN SDK
// ====================================================================
// Khởi tạo Admin SDK MỘT LẦN DUY NHẤT nếu chưa được khởi tạo.
// Admin SDK được dùng để tương tác với Firebase từ phía backend (Auth, Firestore, v.v.).
if (admin.apps.length === 0) {
    try {
        // Đọc Service Account Key đã mã hóa Base64 từ biến môi trường.
        // Biến này được cấu hình an toàn trong Google Cloud Secret Manager.
        const serviceAccountBase64 = process.env.SERVICEACCOUNT_KEY_BASE64; 
        
        // Kiểm tra xem biến môi trường có tồn tại không.
        if (!serviceAccountBase64) {
            console.error("Lỗi khởi tạo Admin SDK: Biến SERVICEACCOUNT_KEY_BASE64 không được định nghĩa trong biến môi trường.");
            // Ném lỗi để báo hiệu Firebase Functions rằng cấu hình ban đầu bị thiếu.
            throw new Error("Missing SERVICEACCOUNT_KEY_BASE64 environment variable.");
        }

        // Giải mã chuỗi Base64 trở lại thành JSON và parse nó.
        const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('ascii'));
        
        // Khởi tạo Firebase Admin SDK.
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://ivsjsc-6362f-default-rtdb.asia-southeast1.firebasedatabase.app" // URL của Realtime Database
        });
        console.log("[Firebase Admin] Firebase Admin SDK đã được khởi tạo thành công.");
    } catch (error) {
        console.error("[Firebase Admin] Lỗi khi khởi tạo Firebase Admin SDK:", error.message);
        console.error("Vui lòng đảm bảo SERVICEACCOUNT_KEY_BASE64 được cấu hình đúng và có định dạng JSON hợp lệ sau khi giải mã Base64.");
        // Ghi lại lỗi nhưng không thoát process để hàm vẫn có thể cố gắng phản hồi các yêu cầu (với lỗi 500).
    }
} else {
    console.log("[Firebase Admin] Firebase Admin SDK đã được khởi tạo trước đó.");
}


// ====================================================================
// ENDPOINT CHO CHATBOT AI (API Proxy cho Gemini API)
// ====================================================================
// Xử lý yêu cầu POST từ frontend để trò chuyện với AI.
app.post('/api/chat', async (req, res) => {
    try {
        const chatHistory = req.body.contents; // Lịch sử trò chuyện từ frontend
        // Đọc Gemini API Key từ biến môi trường.
        const geminiApiKey = process.env.GEMINI_API_KEY; 

        // Kiểm tra xem Gemini API Key có tồn tại không.
        if (!geminiApiKey) {
            console.error("GEMINI_API_KEY không được định nghĩa trong biến môi trường.");
            return res.status(500).json({ error: "Server configuration error: Gemini API Key missing." });
        }
        // Log một phần API Key để xác nhận nó đã được đọc (chỉ 5 ký tự đầu tiên).
        console.log(`[Chatbot API] Gemini API Key read successfully (first 5 chars): ${geminiApiKey.substring(0,5)}`);

        // Xây dựng URL cho Gemini API.
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

        // Gửi yêu cầu POST đến Gemini API.
        const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: chatHistory }) // Gửi lịch sử trò chuyện đến Gemini.
        });

        // Xử lý lỗi nếu Gemini API không phản hồi thành công.
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Lỗi từ Gemini API:", errorData);
            return res.status(response.status).json({ 
                error: `Lỗi từ Gemini API: ${errorData.error ? errorData.error.message : response.statusText || 'Unknown error'}` 
            });
        }

        // Parse phản hồi từ Gemini API và gửi về frontend.
        const result = await response.json();
        res.json(result); 

    } catch (error) {
        // Ghi lại bất kỳ lỗi nào xảy ra trong quá trình xử lý yêu cầu.
        console.error("Lỗi khi xử lý yêu cầu chatbot:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// ====================================================================
// ENDPOINT CHO XÁC THỰC FIREBASE (Authentication)
// ====================================================================
// Các endpoint này cần Firebase Admin SDK đã khởi tạo thành công để hoạt động.

// Endpoint để đăng ký người dùng mới.
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Kiểm tra xem Firebase Admin SDK đã được khởi tạo chưa.
        if (admin.apps.length === 0) {
            return res.status(500).json({ error: "Firebase Admin SDK chưa khởi tạo. Vui lòng kiểm tra cấu hình server." });
        }
        // Tạo người dùng mới trong Firebase Authentication.
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });
        // Tạo Custom Token để frontend có thể đăng nhập.
        const customToken = await admin.auth().createCustomToken(userRecord.uid);
        res.status(201).json({ message: 'Đăng ký thành công!', customToken: customToken });
    } catch (error) {
        console.error("Lỗi đăng ký:", error.code);
        let errorMessage = "Đăng ký không thành công. Vui lòng thử lại.";
        // Xử lý các mã lỗi phổ biến khi đăng ký.
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

// Endpoint để đăng nhập người dùng (tạo Custom Token).
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Kiểm tra xem Firebase Admin SDK đã được khởi tạo chưa.
        if (admin.apps.length === 0) {
            return res.status(500).json({ error: "Firebase Admin SDK chưa khởi tạo. Vui lòng kiểm tra cấu hình server." });
        }
        // LƯU Ý: Phương pháp này không xác thực mật khẩu.
        // TRONG THỰC TẾ, client nên tự đăng nhập bằng Firebase Client SDK và gửi ID Token lên backend để xác minh.
        // Đoạn code này chỉ là ví dụ đơn giản để tạo custom token cho người dùng đã tồn tại.
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

// Endpoint ví dụ được bảo vệ (chỉ truy cập được khi đã đăng nhập và xác thực token).
app.get('/api/protected', async (req, res) => {
    // Lấy ID Token từ header Authorization (Bearer Token).
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    // Kiểm tra xem có token xác thực không.
    if (!idToken) {
        return res.status(401).json({ error: "Không có token xác thực." });
    }

    try {
        // Kiểm tra xem Firebase Admin SDK đã được khởi tạo chưa.
        if (admin.apps.length === 0) {
            return res.status(500).json({ error: "Firebase Admin SDK chưa khởi tạo. Vui lòng kiểm tra cấu hình server." });
        }
        // Xác minh ID Token bằng Firebase Admin SDK.
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid; // Lấy UID của người dùng từ token đã giải mã.
        res.status(200).json({ message: `Dữ liệu được bảo vệ cho người dùng: ${uid}`, data: "Đây là dữ liệu chỉ dành cho người dùng đã xác thực." });
    } catch (error) {
        console.error("Lỗi xác thực token:", error.message);
        res.status(403).json({ error: "Token không hợp lệ hoặc đã hết hạn." });
    }
});


// ====================================================================
// XUẤT ỨNG DỤNG EXPRESS DƯỚI DẠNG MỘT FIREBASE FUNCTION (Functions v2)
// ====================================================================
// Hàm này sẽ được triển khai lên Firebase Functions và có thể truy cập qua một URL.
exports.api = functions
    .region('us-central1') // Định nghĩa khu vực triển khai của hàm (có thể thay đổi).
    .runWith({
        memory: '256MB', // Tùy chọn: Đặt bộ nhớ cho hàm để tối ưu hiệu suất/chi phí.
        timeoutSeconds: 60 // Tùy chọn: Đặt thời gian timeout cho hàm (tối đa 540 giây).
    })
    .https.onRequest(app); // Gán ứng dụng Express của bạn làm Request Handler cho hàm HTTP.
