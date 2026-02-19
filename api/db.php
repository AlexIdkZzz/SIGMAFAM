<?php
header('Content-Type: application/json; charset=utf-8');

$host = "127.0.0.1";   // mejor que "localhost" en Windows a veces
$port = "3310";        // <-- CAMBIA esto si tu MySQL usa otro puerto (ej. 3307)
$db   = "sigmafam";
$user = "root";
$pass = "";

try {
  $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
  $pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode([
    "error" => "DB connection failed",
    "detail" => $e->getMessage()
  ]);
  exit;
}
