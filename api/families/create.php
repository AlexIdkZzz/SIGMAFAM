<?php
require __DIR__ . "/../auth/guard_role.php";
require_role(["ADMIN","FAMILY_ADMIN"]); // Admin puede todo, Family_admin también puede crear su familia
require __DIR__ . "/../db.php";

$input = json_decode(file_get_contents("php://input"), true);
$name = trim($input["name"] ?? "");

if ($name === "") { http_response_code(400); echo json_encode(["error"=>"name required"]); exit; }

$user_id = $_SESSION["user_id"];

$pdo->beginTransaction();

$stmt = $pdo->prepare("INSERT INTO families (name, created_by) VALUES (?, ?)");
$stmt->execute([$name, $user_id]);
$family_id = (int)$pdo->lastInsertId();

// el creador queda como FAMILY_ADMIN dentro de su familia
$stmt = $pdo->prepare("INSERT INTO family_members (family_id, user_id, member_role) VALUES (?, ?, 'FAMILY_ADMIN')");
$stmt->execute([$family_id, $user_id]);

// si el usuario NO es ADMIN, lo ponemos como FAMILY_ADMIN global también
if (($_SESSION["user_role"] ?? "") !== "ADMIN") {
  $pdo->prepare("UPDATE users SET role='FAMILY_ADMIN' WHERE id=?")->execute([$user_id]);
  $_SESSION["user_role"] = "FAMILY_ADMIN";
}

$pdo->commit();

echo json_encode(["ok"=>true, "family_id"=>$family_id]);
