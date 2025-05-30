<?php
// Disable error display in response
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Direct CORS headers first
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Connect to DB
    $host = "localhost";
    $dbname = "campus_db"; 
    $dbuser = "root";
    $dbpass = "";

    $conn = new mysqli($host, $dbuser, $dbpass, $dbname);

    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Get current date and time
    $currentDateTime = date('Y-m-d H:i:s');

    // Get all reservations with user and resource information
    $sql = "SELECT r.*, u.firstname, u.lastname, res.name as resource_name,
            CASE WHEN r.end_time < ? THEN 'finished' ELSE r.status END as display_status
            FROM reservations r
            JOIN users u ON r.user_id = u.user_id
            JOIN resources res ON r.resource_id = res.resource_id
            ORDER BY r.start_time DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $currentDateTime);
    $stmt->execute();
    $result = $stmt->get_result();

    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $transactions = [];
    while ($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }

    // Return results
    echo json_encode([
        "success" => true,
        "transactions" => $transactions
    ]);

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    // Log error to server log
    error_log("Error in transactions.php: " . $e->getMessage());
    
    // Return error as JSON
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>