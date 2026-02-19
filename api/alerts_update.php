<?php
require __DIR__ . "/auth/guard.php";
require __DIR__ . "/db.php";

$input = json_decode(file_get_contents("php://input"), true);

$id = $input["id"] ?? null;
$status = $input["status"] ?? null;

$allowed = ["recibida", "atendida", "cerrada"];

if (!$id || !$status) {
  http_response_code(400);
  echo json_encode(["error" => "id and status required"]);
  exit;
}

if (!in_array($status, $allowed, true)) {
  http_response_code(400);
  echo json_encode(["error" => "invalid status"]);
  exit;
}

$stmt = $pdo->prepare("UPDATE alerts SET status = ? WHERE id = ?");
$stmt->execute([$status, $id]);

echo json_encode(["ok" => true]);
