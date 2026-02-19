<?php
require __DIR__ . "/../auth/guard_role.php";
require __DIR__ . "/../db.php";

$input = json_decode(file_get_contents("php://input"), true);
$family_id = (int)($input["family_id"] ?? 0);
$email = trim($input["email"] ?? "");
$member_role = $input["member_role"] ?? "FAMILY_MEMBER";

if (!$family_id || $email==="") { http_response_code(400); echo json_encode(["error"=>"family_id and email required"]); exit; }
if (!in_array($member_role, ["FAMILY_MEMBER","FAMILY_ADMIN"], true)) { http_response_code(400); echo json_encode(["error"=>"invalid member_role"]); exit; }

$user_id = (int)($_SESSION["user_id"]);
$user_role = $_SESSION["user_role"] ?? "FAMILY_MEMBER";

// Si no eres ADMIN, debes ser admin de ESA familia
if ($user_role !== "ADMIN") {
  $chk = $pdo->prepare("SELECT 1 FROM family_members WHERE family_id=? AND user_id=? AND member_role='FAMILY_ADMIN'");
  $chk->execute([$family_id, $user_id]);
  if (!$chk->fetchColumn()) {
    http_response_code(403);
    echo json_encode(["error"=>"Forbidden"]);
    exit;
  }
}

// buscar usuario por email
$stmt = $pdo->prepare("SELECT id, role FROM users WHERE email=?");
$stmt->execute([$email]);
$u = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$u) { http_response_code(404); echo json_encode(["error"=>"user not found"]); exit; }

$member_id = (int)$u["id"];

// insert membership
try {
  $ins = $pdo->prepare("INSERT INTO family_members (family_id, user_id, member_role) VALUES (?, ?, ?)");
  $ins->execute([$family_id, $member_id, $member_role]);

  // Si agregas como admin de familia, sube rol global si no era ADMIN
  if ($member_role === "FAMILY_ADMIN" && $u["role"] !== "ADMIN") {
    $pdo->prepare("UPDATE users SET role='FAMILY_ADMIN' WHERE id=?")->execute([$member_id]);
  }

  echo json_encode(["ok"=>true]);
} catch (Exception $e) {
  http_response_code(409);
  echo json_encode(["error"=>"already member"]);
}
