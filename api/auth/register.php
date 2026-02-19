<?php
session_start();
require __DIR__ . "/../db.php";

$input = json_decode(file_get_contents("php://input"), true);

$name = trim($input["name"] ?? "");
$email = trim($input["email"] ?? "");
$password = $input["password"] ?? "";

if ($name === "" || $email === "" || $password === "") {
  http_response_code(400);
  echo json_encode(["error" => "name, email and password required"]);
  exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(["error" => "invalid email"]);
  exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);

try {
  $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
  $stmt->execute([$name, $email, $hash]);

  // Auto-login al registrarse
  $_SESSION["user_id"] = $pdo->lastInsertId();
  $_SESSION["user_name"] = $name;

  echo json_encode(["ok" => true]);
} catch (Exception $e) {
  // email duplicado
  http_response_code(409);
  echo json_encode(["error" => "email already exists"]);
}
