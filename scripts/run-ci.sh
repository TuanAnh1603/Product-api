#!/usr/bin/env sh
set -eu
export PORT=3000
export MONGO_URI="${MONGO_URI:-mongodb://127.0.0.1:27017/productdb}"
npm start > /tmp/product-api.log 2>&1 &
API_PID=$!
cleanup() { kill "$API_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
npm test
