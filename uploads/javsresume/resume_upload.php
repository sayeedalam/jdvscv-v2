<?php
// ===============================
// resume_upload.php
// Secure Resume Upload Handler for JDvsCV v2
// ===============================

// ---------- Open CORS (for live testing) ----------
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ---------- Main logic ----------
header('Content-Type: application/json; charset=utf-8');

// Configuration
$uploadDir  = __DIR__ . '/';     // Current folder
$maxSize    = 5 * 1024 * 1024;   // 5 MB limit
$allowedTypes = [
    'application/pdf'                                                  => 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
    'application/msword'                                               => 'doc',
    'text/plain'                                                       => 'txt'
];

// Validate request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

if (!isset($_FILES['resume'])) {
    echo json_encode(['status' => 'error', 'message' => 'No resume file uploaded']);
    exit;
}

$file = $_FILES['resume'];

// Validate file size
if ($file['size'] > $maxSize) {
    echo json_encode(['status' => 'error', 'message' => 'File too large (max 5 MB)']);
    exit;
}

// Validate MIME type
$mime = mime_content_type($file['tmp_name']);
if (!array_key_exists($mime, $allowedTypes)) {
    echo json_encode(['status' => 'error', 'message' => 'Unsupported file type: ' . $mime]);
    exit;
}

// Generate unique filename
$ext      = $allowedTypes[$mime];
$newName  = 'cv_' . uniqid() . '.' . $ext;
$destPath = $uploadDir . $newName;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to save uploaded file']);
    exit;
}

// ---------- Success response ----------
echo json_encode([
    'status'   => 'success',
    'filename' => $newName,
    'path'     => '/jdvscv2/uploads/javsresume/' . $newName
]);
exit;
?>
