/**
 * Quan trọng: File này là lõi xử lý backend cho các dịch vụ của IVS.
 * Nó được viết theo chuẩn Firebase Functions v2, sử dụng Secret Manager để tăng cường bảo mật.
 *
 * Yêu cầu:
 * 1. Đã cài đặt các gói: firebase-functions, firebase-admin, express, cors, body-parser
 * 2. Đã cấu hình secrets trong Firebase Secret Manager:
 * - SERVICEACCOUNT_KEY_BASE64: Chứa chuỗi base64 của file JSON service account.
 * - GEMINI_API_KEY: Chứa API key cho các dịch vụ Google AI (nếu có).
 */

const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// --- ĐỊNH NGHĨA CÁC SECRET SẼ SỬ DỤNG ---
// Bước này khai báo cho Firebase biết function này cần truy cập vào những "bí mật" nào.
const serviceAccountKeySecret = functions.params.defineSecret("SERVICEACCOUNT_KEY_BASE64");
const geminiApiKeySecret = functions.params.defineSecret("GEMINI_API_KEY");

// Biến cờ để đảm bảo Admin SDK chỉ được khởi tạo một lần duy nhất.
let isAppInitialized = false;

/**
 * Hàm khởi tạo Firebase Admin SDK một cách an toàn.
 * Hàm này sẽ đọc giá trị của secret, giải mã base64 để lấy lại file JSON,
 * và dùng nó để khởi tạo Admin SDK.
 * @param {string} serviceAccountKeyBase64 - Giá trị secret đã được nạp.
 */
function initializeFirebaseApp(serviceAccountKeyBase64) {
    if (isAppInitialized) {
        return;
    }
    try {
        // Giải mã chuỗi Base64 về lại định dạng chuỗi JSON.
        const serviceAccountString = Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(serviceAccountString);

        // Khởi tạo Admin SDK với thông tin xác thực vừa giải mã.
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        console.log("Firebase Admin SDK initialized successfully.");
        isAppInitialized = true;
    } catch (error) {
        console.error("CRITICAL: Failed to initialize Firebase Admin SDK.", error);
    }
}


// --- TẠO MỘT API SERVER SỬ DỤNG EXPRESS ---
const app = express();

// Tự động cho phép các yêu cầu từ tên miền khác (Cross-Origin Resource Sharing)
app.use(cors({ origin: true }));
app.use(bodyParser.json());


// --- ĐỊNH NGHĨA CÁC ĐƯỜNG DẪN (ROUTES) CHO API ---

// Route ví dụ: /hello
app.get("/hello", (req, res) => {
    res.status(200).send("Hello from IVS Backend API!");
});

// Route để lấy danh sách người dùng từ Firebase Authentication
app.get("/users", async (req, res) => {
    if (!isAppInitialized) {
        return res.status(500).send("Admin SDK is not initialized.");
    }
    try {
        const userRecords = await admin.auth().listUsers(100); // Lấy 100 người dùng đầu tiên
        const users = userRecords.users.map(user => ({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            lastSignInTime: user.metadata.lastSignInTime,
        }));
        return res.status(200).json(users);
    } catch (error) {
        console.error("Error listing users:", error);
        return res.status(500).send("Error fetching user list.");
    }
});


// --- XUẤT CLOUD FUNCTION CHÍNH ---
// Đây là điểm khởi đầu, nơi chúng ta "bọc" Express app của mình trong một Cloud Function.
// Cấu hình `secrets` yêu cầu Firebase nạp các giá trị từ Secret Manager trước khi chạy function.
exports.api = functions.https.onRequest(
    {
        region: "us-central1", // Có thể đổi sang asia-southeast1 (Singapore) để giảm độ trễ
        secrets: [serviceAccountKeySecret, geminiApiKeySecret],
    },
    (req, res) => {
        // Luôn chạy hàm khởi tạo trước khi xử lý bất kỳ yêu cầu nào.
        // `serviceAccountKeySecret.value()` sẽ trả về giá trị thực của secret.
        initializeFirebaseApp(serviceAccountKeySecret.value());
        
        // Chuyển tiếp yêu cầu đến Express app để xử lý.
        return app(req, res);
    }
);
