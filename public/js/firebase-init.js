// FILE: /js/firebase-init.js
// VERSION: 1.0 - Firebase Initialization and Authentication
// DESCRIPTION: Initializes Firebase services (Auth, Firestore) and handles user authentication.

window.addEventListener('DOMContentLoaded', async () => {
    // Import các module Firebase cần thiết
    // Đảm bảo các URL này là chính xác và có thể truy cập được
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js");
    const { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js");
    const { getFirestore, doc, getDoc, setDoc, addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js"); 
    
    // Firebase configuration
    // LƯU Ý QUAN TRỌNG: KHÔNG ĐẶT API KEY TRỰC TIẾP TẠI ĐÂY KHI TRIỂN KHAI CÔNG KHAI.
    // Trong môi trường Canvas này, cấu hình Firebase sẽ được cung cấp tự động thông qua __firebase_config.
    // Khi triển khai lên môi trường production của riêng bạn, bạn NÊN sử dụng các biến môi trường
    // hoặc cấu hình phía server để bảo vệ API Key của mình.
    const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

    // Khởi tạo Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Biến toàn cục để lưu trạng thái xác thực và userID
    let currentUserId = null;
    let isAuthReady = false;

    // Xử lý xác thực người dùng
    async function authenticateFirebase() {
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token !== '') {
                await signInWithCustomToken(auth, __initial_auth_token);
                console.log("[Firebase Init] Đăng nhập Firebase bằng custom token thành công.");
            } else {
                await signInAnonymously(auth);
                console.log("[Firebase Init] Đăng nhập Firebase ẩn danh thành công.");
            }
        } catch (error) {
            console.error("[Firebase Init] Lỗi khi xác thực Firebase:", error);
        }
    }

    // Lắng nghe trạng thái xác thực
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId = user.uid;
            console.log("[Firebase Init] Người dùng đã đăng nhập. UID:", currentUserId);
        } else {
            currentUserId = null;
            console.log("[Firebase Init] Người dùng đã đăng xuất.");
        }
        isAuthReady = true; // Đánh dấu rằng trạng thái xác thực đã sẵn sàng
    });

    // Bắt đầu xác thực Firebase khi DOM đã tải xong
    await authenticateFirebase();

    // Hàm kiểm tra trạng thái auth và trả về userId (để dùng nội bộ bởi các component khác)
    window.getFirebaseUserId = () => {
        if (isAuthReady) {
            return currentUserId;
        } else {
            console.warn("[Firebase Init] Firebase Auth chưa sẵn sàng. Đang chờ xác thực.");
            return null;
        }
    };

    // Hàm lấy một tài liệu từ Firestore (được dùng nội bộ bởi các component khác hoặc logic ẩn)
    window.getFirestoreDocument = async (collectionName, documentId) => {
        if (!isAuthReady || !currentUserId) { // Cần xác thực và UID để tương tác Firestore
            console.error("[Firebase Init] Firebase Auth chưa sẵn sàng hoặc người dùng chưa đăng nhập. Không thể truy cập dữ liệu Firestore.");
            return null;
        }

        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const docRef = doc(db, `artifacts/${appId}/public/data/${collectionName}`, documentId);
        
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                console.log("[Firebase Init] Dữ liệu tài liệu Firestore:", docSnap.data());
                return docSnap.data();
            } else {
                console.log("[Firebase Init] Không tìm thấy tài liệu Firestore!");
                return null;
            }
        } catch (error) {
            console.error("[Firebase Init] Lỗi khi lấy tài liệu Firestore:", error);
            return null;
        }
    };

    // Đặt các đối tượng Firebase vào window scope để các script khác có thể truy cập
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.firestoreDb = db;
    console.log("[Firebase Init] Firebase đã sẵn sàng.");
});
