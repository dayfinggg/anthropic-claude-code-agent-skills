#!/usr/bin/env bash
set -euo pipefail

mkdir -p orders

cat > orders/__init__.py <<'EOF'
EOF

cat > orders/db.py <<'EOF'
import sqlite3

connection = sqlite3.connect("orders.sqlite3")
connection.row_factory = sqlite3.Row


def query(sql):
    return [dict(row) for row in connection.execute(sql)]


def get(table, row_id):
    row = connection.execute(f"SELECT * FROM {table} WHERE id = ?", (row_id,)).fetchone()
    return None if row is None else dict(row)
EOF

cat > orders/repo.py <<'EOF'
from orders import db

PAGE_SIZE = 50
ALLOWED_STATUSES = {"open", "paid", "cancelled"}


def find_orders(status, page):
    if status not in ALLOWED_STATUSES:
        raise ValueError(f"unknown status {status}")
    offset = page * PAGE_SIZE
    return db.query(f"SELECT id, total FROM orders WHERE status = '{status}' ORDER BY id LIMIT {PAGE_SIZE} OFFSET {offset}")


def load_order(order_id):
    row = db.get("orders", order_id)
    if row is None:
        raise LookupError(f"order {order_id} not found")
    return row
EOF

cat > orders/api.py <<'EOF'
from orders.repo import find_orders, load_order


def list_orders(request):
    page = int(request.query.get("page", "1"))
    status = request.query.get("status", "open")
    return find_orders(status, page)


def order_total(request):
    order = load_order(int(request.path_params["order_id"]))
    return {"id": order["id"], "total": order["total"]}
EOF

cat > README.md <<'EOF'
# Orders API

`GET /orders?status=open&page=1` returns one page of 50 orders. Pages start at 1.

`GET /orders/{order_id}/total` returns the total of one order.
EOF
