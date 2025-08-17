#!/usr/bin/env bash
API_BASE="<API_BASE>"

echo "Create item"
curl -s -X POST "$API_BASE/items" -H "Content-Type: application/json" -d
'{"id":"1","title":"Buy milk"}' | jq
echo "Get item"
curl -s "$API_BASE/items/1" | jq
echo "List items"
curl -s "$API_BASE/items" | jq
echo "Update item"
curl -s -X PUT "$API_BASE/items/1" -H "Content-Type: application/json" -d
'{"title":"Buy oat milk"}' | jq
echo "Delete item"
curl -s -X DELETE "$API_BASE/items/1" -w "\nHTTP STATUS: %{http_code}\n"
