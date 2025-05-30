<?php
// Disable error display in response
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Direct CORS headers first - must be before any output
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

    // Get all approved events (both upcoming and finished)
    $sql = "SELECT r.reservation_id, r.event_name as name, r.start_time, r.end_time, 
                   r.status, r.purpose, r.approved_by, 
                   res.name as venue, res.location,
                   u.firstname, u.lastname, u.department
            FROM reservations r
            JOIN resources res ON r.resource_id = res.resource_id
            JOIN users u ON r.user_id = u.user_id
            WHERE r.status = 'approved'
            ORDER BY r.start_time DESC";
    
    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $events = [];
    while ($row = $result->fetch_assoc()) {
        // Format dates and times
        $startTime = new DateTime($row['start_time']);
        $endTime = new DateTime($row['end_time']);
        
        $row['date'] = $startTime->format('Y-m-d');
        $row['time'] = $startTime->format('h:i A') . ' - ' . $endTime->format('h:i A');
        $row['organizer'] = $row['firstname'] . ' ' . $row['lastname'];
        
        // Add a flag to indicate if the event is finished
        $currentTime = new DateTime();
        $row['is_finished'] = ($endTime < $currentTime) ? true : false;
        
        $events[] = $row;
    }

    // Return results
    echo json_encode([
        "success" => true,
        "events" => $events
    ]);

    $conn->close();
} catch (Exception $e) {
    // Log error to server log
    error_log("Error in approved_events.php: " . $e->getMessage());
    
    // Return error as JSON
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>