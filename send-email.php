<?php
// It's a good practice to prevent direct access to this file.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

// --- CONFIGURATION ---
// Set the recipient email address.
// IMPORTANT: Replace this with the actual email address for receiving consultation requests.
$recipient_email = "tuvan@ivs.edu.vn"; 

// Set the email subject.
$subject = "Yêu cầu tư vấn mới từ Website IVS Academy";
// --- END CONFIGURATION ---


// Function to send a JSON response.
function send_json_response($status, $message) {
    header('Content-Type: application/json');
    echo json_encode(['status' => $status, 'message' => $message]);
    exit;
}

// --- DATA VALIDATION & SANITIZATION ---
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$organization = isset($_POST['organization']) ? trim($_POST['organization']) : '';
$service = isset($_POST['service']) ? trim($_POST['service']) : '';

// Basic validation.
if (empty($name) || empty($phone) || empty($email) || empty($service)) {
    send_json_response('error', 'Vui lòng điền đầy đủ các trường bắt buộc.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json_response('error', 'Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.');
}

// Sanitize data before using it to prevent XSS attacks.
$name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$phone = htmlspecialchars($phone, ENT_QUOTES, 'UTF-8');
$email = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$organization = htmlspecialchars($organization, ENT_QUOTES, 'UTF-8');
$service = htmlspecialchars($service, ENT_QUOTES, 'UTF-8');


// --- EMAIL COMPOSITION ---
// Create the email headers.
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= 'From: IVS Academy Website <no-reply@ivsacademy.edu.vn>' . "\r\n"; // Use a no-reply address from your domain.

// Create the email body using HTML for better formatting.
$email_body = "
<html>
<head>
    <title>{$subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 600px; }
        .label { font-weight: bold; color: #555; }
    </style>
</head>
<body>
    <div class='container'>
        <h2>{$subject}</h2>
        <p>Bạn vừa nhận được một yêu cầu tư vấn mới với các thông tin sau:</p>
        <hr>
        <p><span class='label'>Họ và tên:</span> {$name}</p>
        <p><span class='label'>Số điện thoại:</span> {$phone}</p>
        <p><span class='label'>Email:</span> {$email}</p>
        <p><span class='label'>Tổ chức:</span> " . ($organization ?: 'Không cung cấp') . "</p>
        <p><span class='label'>Dịch vụ quan tâm:</span> {$service}</p>
        <hr>
        <p><small>Email này được gửi tự động từ hệ thống website IVS Academy.</small></p>
    </div>
</body>
</html>
";

// --- SEND EMAIL ---
// Use the mail() function to send the email.
// Note: For this to work, the server must be configured to send emails (e.g., have sendmail or an SMTP service set up).
if (mail($recipient_email, $subject, $email_body, $headers)) {
    send_json_response('success', 'Yêu cầu của bạn đã được gửi thành công! Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.');
} else {
    // This error is for the developer/server admin.
    // The user will see a more generic message.
    error_log("Failed to send email to {$recipient_email}"); 
    send_json_response('error', 'Hệ thống không thể gửi yêu cầu vào lúc này. Vui lòng thử lại sau hoặc liên hệ trực tiếp.');
}
?>
