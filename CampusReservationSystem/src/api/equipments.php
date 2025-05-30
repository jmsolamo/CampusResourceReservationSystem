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
    // Connect to DB
    $host = "localhost";
    $dbname = "campus_db"; 
    $dbuser = "root";
    $dbpass = "";

    $conn = new mysqli($host, $dbuser, $dbpass, $dbname);

    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Check if equipments table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'equipments'");
    if ($tableCheck->num_rows == 0) {
        // Create equipments table if it doesn't exist
        $createTableSQL = "CREATE TABLE `equipments` (
            `equipment_id` int(11) NOT NULL AUTO_INCREMENT,
            `name` varchar(100) NOT NULL,
            `stock` int(11) DEFAULT 0,
            `description` text DEFAULT NULL,
            `location` varchar(100) DEFAULT NULL,
            PRIMARY KEY (`equipment_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
        
        if (!$conn->query($createTableSQL)) {
            throw new Exception("Failed to create equipments table: " . $conn->error);
        }
        
        // Add some sample equipment
        $sampleEquipments = [
            ["Projector", 10, "Standard HD projector", "Main Campus"],
            ["Microphone", 20, "Wireless microphone", "Main Campus"],
            ["Laptop", 15, "Dell Latitude", "East Campus"],
            ["Speaker System", 5, "High-quality audio system", "West Campus"],
            ["Extension Cord", 30, "10-meter extension cord", "Main Campus"]
        ];
        
        $insertStmt = $conn->prepare("INSERT INTO equipments (name, stock, description, location) VALUES (?, ?, ?, ?)");
        foreach ($sampleEquipments as $equipment) {
            $insertStmt->bind_param("siss", $equipment[0], $equipment[1], $equipment[2], $equipment[3]);
            $insertStmt->execute();
        }
        $insertStmt->close();
    }

    // Get all equipment
    $sql = "SELECT * FROM equipments ORDER BY name ASC";
    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $equipments = [];
    while ($row = $result->fetch_assoc()) {
        $equipments[] = $row;
    }

    // Return results
    echo json_encode([
        "success" => true,
        "equipments" => $equipments
    ]);

    $conn->close();
} catch (Exception $e) {
    // Log error to server log
    error_log("Error in equipments.php: " . $e->getMessage());
    
    // Return error as JSON
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>