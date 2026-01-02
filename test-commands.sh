#!/bin/bash

# ============================================
# MongoDB & Application Testing Commands
# ============================================

echo "============================================"
echo "🧪 Testing MongoDB Atlas Connection"
echo "============================================"
npm run test-cloud

echo -e "\n============================================"
echo "🏥 Testing Server Health"
echo "============================================"
curl -s http://localhost:5000/api/health | python3 -m json.tool

echo -e "\n============================================"
echo "🔐 Testing Login (Admin)"
echo "============================================"
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@laundry.com","password":"admin123"}' | python3 -m json.tool

echo -e "\n============================================"
echo "👥 Listing Users in Database"
echo "============================================"
npm run list-users

echo -e "\n============================================"
echo "📋 Verifying Cloud Data"
echo "============================================"
npm run verify-cloud

echo -e "\n============================================"
echo "✅ Testing Complete!"
echo "============================================"

