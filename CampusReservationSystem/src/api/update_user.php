<?php
// Disable error display in response
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Direct CORS headers first - must be before any output
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Only allow POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Method not allowed");
    }

    // Get JSON data from request
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        throw new Exception("Invalid JSON data");
    }

    // Validate required fields
    if (!isset($data['user_id']) || empty($data['user_id'])) {
        throw new Exception("User ID is required");
    }

    $requiredFields = ['firstname', 'lastname', 'email', 'role'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    // Connect to DB
    $host = "localhost";
    $dbname = "campus_db"; 
    $dbuser = "root";
    $dbpass = "";

    $conn = new mysqli($host, $dbuser, $dbpass, $dbname);

    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Check if user exists
    $checkStmt = $conn->prepare("SELECT * FROM users WHERE user_id = ?");
    $checkStmt->bind_param("i", $data['user_id']);
    $checkStmt->execute();
    $result = $checkStmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception("User not found");
    }
    $checkStmt->close();

    // Check if email is already used by another user
    $emailCheckStmt = $conn->prepare("SELECT * FROM users WHERE email = ? AND user_id != ?");
    $emailCheckStmt->bind_param("si", $data['email'], $data['user_id']);
    $emailCheckStmt->execute();
    $emailResult = $emailCheckStmt->get_result();

    if ($emailResult->num_rows > 0) {
        throw new Exception("Email already in use by another user");
    }
    $emailCheckStmt->close();

    // Set default values for optional fields
    $middlename = isset($data['middlename']) ? $data['middlename'] : null;
    $department = isset($data['department']) ? $data['department'] : null;

    // Update user
    $stmt = $conn->prepare("UPDATE users SET firstname = ?, middlename = ?, lastname = ?, department = ?, email = ?, role = ? WHERE user_id = ?");
    $stmt->bind_param("ssssssi", 
        $data['firstname'], 
        $middlename, 
        $data['lastname'], 
        $department, 
        $data['email'], 
        $data['role'],
        $data['user_id']
    );

    if (!$stmt->execute()) {
        throw new Exception("Error updating user: " . $stmt->error);
    }

    $stmt->close();
    $conn->close();

    // Return success response
    echo json_encode([
        "success" => true,
        "message" => "User updated successfully"
    ]);

} catch (Exception $e) {
    // Log error to server log
    error_log("Error in update_user.php: " . $e->getMessage());
    
    // Return error as JSON
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>