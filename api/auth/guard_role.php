<?php
session_start();

if (!isset($_SESSION["user_id"])) {
  http_response_code(401);
  echo json_encode(["error" => "Unauthorized"]);
  exit;
}

// Uso: require_role(['ADMIN','FAMILY_ADMIN']);
function require_role(array $allowed_roles) {
  $role = $_SESSION["user_role"] ?? "FAMILY_MEMBER";
  if (!in_array($role, $allowed_roles, true)) {
    http_response_code(403);
    echo json_encode(["error" => "Forbidden"]);
    exit;
  }
}
