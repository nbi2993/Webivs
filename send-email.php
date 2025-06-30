<?php
// Import PHPMailer classes into the global namespace
// These must be at the top of your script, not inside a function
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Load Composer's autoloader
// This is crucial for PHPMailer to work.
// You must run 'composer require phpmailer/phpmailer' in your project.
require 'vendor/autoload.php';

// It's a good practice to prevent direct access to this file.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

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

// Sanitize data.
$name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$phone = htmlspecialchars($phone, ENT_QUOTES, 'UTF-8');
$email_sanitized = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$organization = htmlspecialchars($organization, ENT_QUOTES, 'UTF-8');
$service = htmlspecialchars($service, ENT_QUOTES, 'UTF-8');

// --- EMAIL COMPOSITION ---
$subject = "Yêu cầu tư vấn mới từ Website IVS Academy";
$email_body = "
<html>
<body>
    <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 600px;'>
        <h2>{$subject}</h2>
        <p>Bạn vừa nhận được một yêu cầu tư vấn mới với các thông tin sau:</p>
        <hr>
        <p><strong>Họ và tên:</strong> {$name}</p>
        <p><strong>Số điện thoại:</strong> {$phone}</p>
        <p><strong>Email:</strong> {$email_sanitized}</p>
        <p><strong>Tổ chức:</strong> " . ($organization ?: 'Không cung cấp') . "</p>
        <p><strong>Dịch vụ quan tâm:</strong> {$service}</p>
        <hr>
        <p><small>Email này được gửi tự động từ hệ thống website IVS Academy.</small></p>
    </div>
</body>
</html>
";

// --- SEND EMAIL VIA SMTP USING PHPMailer ---
$mail = new PHPMailer(true);

try {
    // --- SERVER SETTINGS (IMPORTANT: Use Environment Variables for security) ---
    // $mail->SMTPDebug = SMTP::DEBUG_SERVER;                      // Enable verbose debug output for troubleshooting
    $mail->isSMTP();                                            // Send using SMTP
    $mail->Host       = getenv('SMTP_HOST') ?: 'smtp.example.com';  // Set the SMTP server to send through
    $mail->SMTPAuth   = true;                                   // Enable SMTP authentication
    $mail->Username   = getenv('SMTP_USER') ?: 'user@example.com';  // SMTP username
    $mail->Password   = getenv('SMTP_PASS') ?: 'your_smtp_password'; // SMTP password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;            // Enable implicit TLS encryption
    $mail->Port       = getenv('SMTP_PORT') ?: 587;               // TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`

    // --- RECIPIENTS ---
    $mail->setFrom(getenv('SMTP_FROM_EMAIL') ?: 'no-reply@ivsacademy.edu.vn', getenv('SMTP_FROM_NAME') ?: 'IVS Academy Website');
    $mail->addAddress('tuvan@ivs.edu.vn', 'Bộ phận tư vấn IVS');     // Add a recipient
    $mail->addReplyTo($email, $name); // Set reply-to to the user's email

    // --- CONTENT ---
    $mail->isHTML(true);                                  // Set email format to HTML
    $mail->CharSet = 'UTF-8';
    $mail->Subject = $subject;
    $mail->Body    = $email_body;
    $mail->AltBody = strip_tags($email_body); // Plain text version for non-HTML mail clients

    $mail->send();
    send_json_response('success', 'Yêu cầu của bạn đã được gửi thành công! Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.');

} catch (Exception $e) {
    // Log the detailed error for the developer
    error_log("Message could not be sent. Mailer Error: {$mail->ErrorInfo}");
    // Send a generic error message to the user
    send_json_response('error', 'Hệ thống không thể gửi yêu cầu vào lúc này. Vui lòng thử lại sau.');
}
?>
