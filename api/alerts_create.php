<?php
require __DIR__ . "/auth/guard.php";
require __DIR__ . "/db.php";

$input = json_decode(file_get_contents("php://input"), true);

$user_id = $input["user_id"] ?? 1;
$lat     = $input["lat"] ?? null;
$lng     = $input["lng"] ?? null;
$source  = $input["source"] ?? "web";

$family_id = null;
$q = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id=? LIMIT 1");
$q->execute([$user_id]);
$family_id = $q->fetchColumn() ?: null;


if ($lat === null || $lng === null) {
  http_response_code(400);
  echo json_encode(["error" => "lat and lng required"]);
  exit;
}

$stmt = $pdo->prepare("
  INSERT INTO alerts (user_id, family_id, lat, lng, source)
  VALUES (?, ?, ?, ?, ?)
");
$stmt->execute([$user_id, $family_id, $lat, $lng, $source]);

echo json_encode(["ok" => true, "alert_id" => $pdo->lastInsertId()]);
