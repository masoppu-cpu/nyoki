#!/bin/bash

# 色付き出力用
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== nyoki ユーザーAPI 動作確認 ===${NC}\n"

# 設定（実行時に自動で取得される値を使用）
echo "1. Supabase環境情報を入力してください:"
read -p "anon key (supabase start実行時に表示): " ANON_KEY

# テストユーザーのトークンを取得
echo -e "\n2. テストユーザーでログイン中..."
AUTH_RESPONSE=$(curl -s -X POST \
  'http://localhost:54321/auth/v1/token?grant_type=password' \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }')

TOKEN=$(echo $AUTH_RESPONSE | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ ログイン失敗。test@example.comユーザーを作成してください${NC}"
    echo "レスポンス: $AUTH_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ ログイン成功${NC}\n"

# 各APIのテスト
echo -e "${YELLOW}3. API動作確認:${NC}\n"

# user-profile
echo -n "📋 user-profile (GET): "
PROFILE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET 'http://localhost:54321/functions/v1/user-profile' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY")

STATUS=$(echo "$PROFILE_RESPONSE" | tail -n 1)
BODY=$(echo "$PROFILE_RESPONSE" | head -n -1)

if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    echo "   レスポンス: $(echo $BODY | jq -c '.data | {name, is_premium}' 2>/dev/null || echo $BODY | head -c 100)"
else
    echo -e "${RED}❌ エラー (Status: $STATUS)${NC}"
    echo "   エラー: $(echo $BODY | head -c 200)"
fi

# user-plants
echo -n "🌱 user-plants (GET): "
PLANTS_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET 'http://localhost:54321/functions/v1/user-plants' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY")

STATUS=$(echo "$PLANTS_RESPONSE" | tail -n 1)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ エラー (Status: $STATUS)${NC}"
fi

# water-plant (テスト用のplant_idが必要なのでスキップ可能)
echo -n "💧 water-plant (POST): "
echo -e "${YELLOW}スキップ（plant_idが必要）${NC}"

# migrate-guest-data
echo -n "📦 migrate-guest-data (POST): "
MIGRATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST 'http://localhost:54321/functions/v1/migrate-guest-data' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"guestData": {}}')

STATUS=$(echo "$MIGRATE_RESPONSE" | tail -n 1)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ エラー (Status: $STATUS)${NC}"
fi

# 結果サマリー
echo -e "\n${YELLOW}=== 確認完了 ===${NC}"
echo "詳細なテストは以下を実行してください:"
echo "  cat supabase/functions/USERS_API_TEST.md"
echo ""
echo "問題があれば教えてください！"