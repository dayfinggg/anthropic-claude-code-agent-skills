#!/usr/bin/env bash
set -eu
cat > greet.php <<'PHP'
<?php
function greet($name = null)
{
    if ($name == null) {
        return "Hello, stranger";
    }
    return "Hello, " . $name;
}

echo greet($_GET["name"]);
PHP
