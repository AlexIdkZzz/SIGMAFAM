<?php
session_start();
session_unset();
session_destroy();
header("Location: /sigmafam/web/login.html");
exit;
