<?php
require __DIR__ . "/auth/guard.php";
require __DIR__ . "/db.php";
require __DIR__ . "/auth/guard_role.php";

$stmt = $pdo->query("
  SELECT a.id, a.user_id, a.lat, a.lng, a.status, a.source, a.created_at, u.name
  FROM alerts a
  JOIN users u ON u.id = a.user_id
  ORDER BY a.id DESC
  LIMIT 50
");

$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows);

$user_id = (int)$_SESSION["user_id"];
$role = $_SESSION["user_role"] ?? "FAMILY_MEMBER";

if ($role === "ADMIN") {
  $stmt = $pdo->query("
    SELECT a.id, a.user_id, a.family_id, a.lat, a.lng, a.status, a.source, a.created_at, u.name
    FROM alerts a
    JOIN users u ON u.id = a.user_id
    ORDER BY a.id DESC
    LIMIT 50
  ");
  echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
  exit;
}

// obtener familia del usuario
$fq = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id=? LIMIT 1");
$fq->execute([$user_id]);
$family_id = $fq->fetchColumn();
if (!$family_id) { echo json_encode([]); exit; }

$stmt = $pdo->prepare("
  SELECT a.id, a.user_id, a.family_id, a.lat, a.lng, a.status, a.source, a.created_at, u.name
  FROM alerts a
  JOIN users u ON u.id = a.user_id
  WHERE a.family_id = ?
  ORDER BY a.id DESC
  LIMIT 50
");
$stmt->execute([$family_id]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

