<?php
// ===============================
// resume_upload.php
// Secure Resume Upload Handler for JDvsCV v2
// ===============================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration
$uploadDir = __DIR__ . '/';  // Current folder
$maxSize   = 5 * 1024 * 1024; // 5MB limit
$allowedTypes = [
    'application/pdf'                                                  => 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
    'application/msword'                                               => 'doc',
    'text/plain'                                                       => 'txt'
];

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
    echo json_encode(['status' => 'error', 'message' => 'File too large (max 5MB)']);
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

// Move file
if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to save uploaded file']);
    exit;
}

// Respond with success JSON
echo json_encode([
    'status'   => 'success',
    'filename' => $newName,
    'path'     => '/jdvscv2/uploads/javsresume/' . $newName
]);
exit;
?>
