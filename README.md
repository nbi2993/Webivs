# KHO MÃ NGUỒN WEBSITE CHÍNH THỨC CỦA IVS JSC (ivsacademy.edu.vn)

## 1. TỔNG QUAN CHIẾN LƯỢC

Đây là kho mã nguồn (repository) chính thức cho cổng thông tin điện tử của **Công ty Cổ phần Dịch vụ Thương mại Integrate Vision Synergy (IVS JSC)**, truy cập tại [ivsacademy.edu.vn](https://ivsacademy.edu.vn/).

Website không chỉ là một kênh thông tin, mà là một nền tảng số chiến lược, được thiết kế để:
-   **Khẳng định vị thế:** Thể hiện vai trò tiên phong của IVS JSC trong lĩnh vực đào tạo STEAM, ngoại ngữ, kỹ năng và tư vấn giáo dục.
-   **Tạo dựng hệ sinh thái:** Là cầu nối giữa học viên, phụ huynh, đối tác giáo dục và các đơn vị thành viên như IVS Academy, IVS Education.
-   **Cung cấp giá trị thực tiễn:** Mang đến các tài nguyên, ứng dụng và thông tin chuyên sâu, phục vụ trực tiếp cho nhu cầu phát triển giáo dục.

## 2. KIẾN TRÚC CÔNG NGHỆ

Dự án được xây dựng trên nền tảng công nghệ linh hoạt, dễ bảo trì và mở rộng, đảm bảo hiệu suất và khả năng tương thích cao.

-   **Frontend:**
    -   **Ngôn ngữ cốt lõi:** HTML5, CSS3, JavaScript (ES6+).
    -   **Framework CSS:** [Tailwind CSS](https://tailwindcss.com/) - Một utility-first framework giúp xây dựng giao diện tùy chỉnh một cách nhanh chóng và nhất quán.
    -   **Kiến trúc:** Component-based (thông qua `loadComponents.js`) giúp tái sử dụng các thành phần giao diện (Header, Footer, FAB) một cách hiệu quả.
-   **Backend & Services:**
    -   **Nền tảng:** [Firebase](https://firebase.google.com/) - Sử dụng các dịch vụ của Google Firebase để xử lý các tác vụ như xác thực, lưu trữ dữ liệu và các chức năng backend-as-a-service khác.
-   **Tính năng đa ngôn ngữ:** Hỗ trợ song ngữ (Tiếng Việt & Tiếng Anh) thông qua các file JSON (`/lang`), đảm bảo khả năng tiếp cận toàn cầu.

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN

Cấu trúc thư mục được tổ chức một cách logic và có chủ đích để tối ưu hóa quá trình phát triển và bảo trì.


/
├── public/                # Thư mục gốc chứa toàn bộ tài sản và mã nguồn của website.
│   ├── css/               # Chứa các file định kiểu (stylesheet) toàn cục.
│   ├── js/                # Chứa các file JavaScript xử lý logic.
│   │   ├── loadComponents.js # Script lõi để tải các thành phần dùng chung.
│   │   ├── firebase-init.js  # Khởi tạo và cấu hình kết nối Firebase.
│   │   └── language.js       # Xử lý logic chuyển đổi ngôn ngữ.
│   ├── components/        # Các thành phần HTML tái sử dụng (header, footer).
│   ├── Pages/             # Các trang con chi tiết về dịch vụ, sản phẩm.
│   ├── Blogs/             # Các bài viết, tin tức chuyên sâu.
│   ├── apps/              # Các ứng dụng web tích hợp (Teacher Hub, CRM...).
│   ├── games/             # Các trò chơi giáo dục.
│   ├── lang/              # Các file JSON chứa nội dung dịch thuật.
│   ├── index.html         # Trang chủ của website.
│   └── ...                # Các trang chính khác (about, contact, solutions...).
├── .gitignore             # Các file và thư mục được Git bỏ qua khi commit.
└── README.md              # Tài liệu tổng quan dự án (file bạn đang đọc).


## 4. TRIỂN KHAI MÔI TRƯỜNG LOCAL

Để thiết lập và chạy dự án trên máy cục bộ, thực hiện theo các bước sau.

### Yêu cầu hệ thống:
-   [Node.js](https://nodejs.org/)
-   Một trình duyệt web hiện đại (Chrome, Firefox, Edge).
-   Một công cụ live server. Khuyến nghị sử dụng `live-server` của `npm`.

### Các bước thực thi:

1.  **Clone repository về máy:**
    ```bash
    git clone [URL-CỦA-REPOSITORY]
    ```

2.  **Di chuyển vào thư mục dự án:**
    ```bash
    cd [TÊN-THƯ-MỤC-DỰ-ÁN]
    ```

3.  **Cài đặt live-server (nếu chưa có):**
    ```bash
    npm install -g live-server
    ```

4.  **Khởi chạy server từ thư mục `public`:**
    ```bash
    live-server public
    ```
    Hệ thống sẽ tự động mở trình duyệt và trỏ đến địa chỉ local (thường là `http://127.0.0.1:8080`).

## 5. QUY TRÌNH ĐÓNG GÓP PHÁT TRIỂN

Mọi đóng góp nhằm cải tiến và nâng cao chất lượng dự án đều được hoan nghênh và cần tuân thủ quy trình chuyên nghiệp.

1.  **Fork** repository.
2.  Tạo một **branch** mới theo quy ước đặt tên: `feature/[Tên-tính-năng]` hoặc `fix/[Vấn-đề-cần-sửa]`.
    ```bash
    git checkout -b feature/NewStrategicComponent
    ```
3.  Thực hiện các thay đổi và **commit** với thông điệp rõ ràng, có ý nghĩa.
    ```bash
    git commit -m "feat: Implement New Strategic Component for user engagement"
    ```
4.  **Push** branch lên repository của bạn.
    ```bash
    git push origin feature/NewStrategicComponent
    ```
5.  Mở một **Pull Request** vào branch `main` của repository gốc và mô tả chi tiết các thay đổi.

## 6. THÔNG TIN PHÁP NHÂN

-   **Tên công ty:** Công ty Cổ phần Dịch vụ Thương mại Integrate Vision Synergy (IVS JSC)
-   **Trụ sở:** 1104, Tổ 6, Ấp Đất Mới, Long Phước, Long Thành, Đồng Nai
-   **Mã số thuế:** 3603960189
-   **Giá trị cốt lõi:** Chất lượng – Tận tâm – Sáng tạo – Bình đẳng

---
*Tài liệu này được biên soạn nhằm đảm bảo tính nhất quán, chuyên nghiệp và hiệu quả trong quá trình phát triển và vận hành nền tảng số của IVS JSC.*
