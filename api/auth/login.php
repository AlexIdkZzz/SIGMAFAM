<?php
session_start();
require __DIR__ . "/../db.php";

$input = json_decode(file_get_contents("php://input"), true);

$email = trim($input["email"] ?? "");
$password = $input["password"] ?? "";

if ($email === "" || $password === "") {
  http_response_code(400);
  echo json_encode(["error" => "email and password required"]);
  exit;
}

$stmt = $pdo->prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user["password_hash"])) {
  http_response_code(401);
  echo json_encode(["error" => "Invalid credentials"]);
  exit;
}

$_SESSION["user_id"] = $user["id"];
$_SESSION["user_name"] = $user["name"];

echo json_encode(["ok" => true]);
