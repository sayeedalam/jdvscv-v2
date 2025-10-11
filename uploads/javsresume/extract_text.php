<?php
// ===============================
// extract_text.php
// Extracts text from uploaded resume file for JDvsCV v2
// ===============================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

// Read JSON input
$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['filename'])) {
    echo json_encode(['status' => 'error', 'message' => 'Filename not provided']);
    exit;
}

$filename = basename($data['filename']);
$filePath = __DIR__ . '/' . $filename;

if (!file_exists($filePath)) {
    echo json_encode(['status' => 'error', 'message' => 'File not found']);
    exit;
}

// Detect extension
$ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
$text = '';

switch ($ext) {
    case 'txt':
        $text = file_get_contents($filePath);
        break;

    case 'docx':
        $zip = new ZipArchive();
        if ($zip->open($filePath) === TRUE) {
            $xml = $zip->getFromName('word/document.xml');
            $xml = str_replace(['</w:r></w:p>', '</w:r></w:p></w:tc><w:tc>'], ["\n", " "], $xml);
            $text = strip_tags($xml);
            $zip->close();
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Unable to open DOCX file']);
            exit;
        }
        break;

    case 'pdf':
        // Fallback: extract basic readable text
        $content = file_get_contents($filePath);
        $text = preg_replace('/[^a-zA-Z0-9\s\.\,\-\@\(\)\:]/', ' ', $content);
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Unsupported file format']);
        exit;
}

$clean = trim(preg_replace('/\s+/', ' ', $text));

echo json_encode([
    'status' => 'success',
    'text'   => mb_substr($clean, 0, 20000) // limit for safety
]);
exit;
?>
