# Users API Test Documentation

## 🧪 Edge Functions テスト手順

### 環境準備
```bash
# Supabaseローカル環境起動
supabase start

# Edge Functionsをserve
supabase functions serve
```

### テスト用認証トークン取得
```bash
# テストユーザーでログイン（Supabase Dashboard経由）
# または以下のコマンドでトークン取得
curl -X POST 'http://localhost:54321/auth/v1/token?grant_type=password' \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

## 1. user-profile Function

### GET: プロファイル取得
```bash
curl -X GET 'http://localhost:54321/functions/v1/user-profile' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

期待されるレスポンス:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "User Name",
    "avatar_url": null,
    "is_premium": false,
    "stats": {
      "total_plants": 0,
      "waterings_this_month": 0,
      "member_since": "2025-01-29T00:00:00Z"
    }
  }
}
```

### PUT: プロファイル更新
```bash
curl -X PUT 'http://localhost:54321/functions/v1/user-profile' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新しい名前",
    "preferences": {
      "notifications": true
    }
  }'
```

## 2. user-plants Function

### GET: 植物一覧取得
```bash
curl -X GET 'http://localhost:54321/functions/v1/user-plants' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### POST: 植物追加
```bash
curl -X POST 'http://localhost:54321/functions/v1/user-plants' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "plant_id": "existing-plant-uuid",
    "nickname": "うちのモンステラ",
    "location": "リビング",
    "water_frequency_days": 7
  }'
```

### PUT: 植物情報更新
```bash
curl -X PUT 'http://localhost:54321/functions/v1/user-plants/{plant_id}' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "新しいニックネーム",
    "location": "ベランダ"
  }'
```

### DELETE: 植物削除
```bash
curl -X DELETE 'http://localhost:54321/functions/v1/user-plants/{plant_id}' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

## 3. water-plant Function

### POST: 水やり記録
```bash
curl -X POST 'http://localhost:54321/functions/v1/water-plant' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "plant_id": "user-plant-uuid",
    "amount": "200ml",
    "notes": "葉っぱも拭いた"
  }'
```

期待されるレスポンス:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_plant_id": "user-plant-uuid",
    "amount": "200ml",
    "notes": "葉っぱも拭いた",
    "watered_at": "2025-01-29T12:00:00Z",
    "next_water_date": "2025-02-05"
  },
  "message": "水やりを記録しました"
}
```

## 4. migrate-guest-data Function

### POST: ゲストデータ移行
```bash
curl -X POST 'http://localhost:54321/functions/v1/migrate-guest-data' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "guestData": {
      "purchase_list": {
        "items": [
          {
            "plant_id": "plant-uuid",
            "added_at": "2025-01-28T00:00:00Z",
            "is_purchased": false
          }
        ]
      },
      "analysis": {
        "light_level": "bright",
        "humidity_level": "moderate",
        "room_size": "medium",
        "temperature_range": "20-25",
        "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
        "recommended_plants": [
          {
            "plant_id": "plant-uuid",
            "score": 0.8,
            "reason": "明るい環境に適しています"
          }
        ]
      }
    }
  }'
```

期待されるレスポンス:
```json
{
  "success": true,
  "migrations": {
    "purchase_list": 1,
    "analyses": 1,
    "images": 1
  },
  "message": "ゲストデータの移行が完了しました"
}
```

## 5. upload-avatar Function

### POST: アバターアップロード
```bash
curl -X POST 'http://localhost:54321/functions/v1/upload-avatar' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -F "avatar=@/path/to/image.jpg"
```

期待されるレスポンス:
```json
{
  "success": true,
  "data": {
    "avatar_url": "https://xxxxx.supabase.co/storage/v1/object/public/user-avatars/user-id/avatar-123456789.jpg"
  },
  "message": "アバターをアップロードしました"
}
```

## エラーケーステスト

### 認証エラー
```bash
# Authorizationヘッダーなし
curl -X GET 'http://localhost:54321/functions/v1/user-profile' \
  -H "apikey: $SUPABASE_ANON_KEY"

# 期待: 401 Unauthorized
```

### 無料プラン制限
```bash
# 6つ目の植物を追加しようとする
curl -X POST 'http://localhost:54321/functions/v1/user-plants' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"plant_id": "plant-uuid"}'

# 期待: 403 Forbidden - LIMIT_EXCEEDED
```

### ファイルサイズ制限
```bash
# 5MB以上のファイルをアップロード
curl -X POST 'http://localhost:54321/functions/v1/upload-avatar' \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -F "avatar=@/path/to/large-file.jpg"

# 期待: 400 Bad Request - FILE_TOO_LARGE
```

## テスト自動化スクリプト

`test_users_api.sh`:
```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
API_URL="http://localhost:54321/functions/v1"
TOKEN="your-test-token"
ANON_KEY="your-anon-key"

# Test function
test_endpoint() {
    local description=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing $description... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            "$API_URL/$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "apikey: $ANON_KEY")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            "$API_URL/$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "apikey: $ANON_KEY" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} (Status: $status_code)"
    else
        echo -e "${RED}✗${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
    fi
}

# Run tests
echo "=== Users API Tests ==="

test_endpoint "GET user-profile" "GET" "user-profile" "" "200"
test_endpoint "PUT user-profile" "PUT" "user-profile" '{"name":"Test User"}' "200"
test_endpoint "GET user-plants" "GET" "user-plants" "" "200"
test_endpoint "POST water-plant" "POST" "water-plant" '{"plant_id":"test-id"}' "200"
test_endpoint "POST migrate-guest-data" "POST" "migrate-guest-data" '{"guestData":{}}' "200"

echo "=== Tests completed ==="
```

## デプロイ手順

```bash
# 1. Edge Functionsをデプロイ
supabase functions deploy user-profile
supabase functions deploy user-plants
supabase functions deploy water-plant
supabase functions deploy migrate-guest-data
supabase functions deploy upload-avatar

# 2. 環境変数設定（必要な場合）
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 3. 本番環境でテスト
# URLを本番環境に変更して上記のcurlコマンドを実行
```

## トラブルシューティング

### よくあるエラーと対処法

1. **PGRST116: プロファイルが存在しない**
   - user-profile GETで自動作成されるよう実装済み

2. **Storage権限エラー**
   - RLSポリシーの確認
   - Service Roleキーの使用を検討

3. **CORS エラー**
   - OPTIONS メソッドのハンドリング実装済み
   - Access-Control-Allow-Origin ヘッダー確認

4. **認証エラー**
   - トークンの有効期限確認
   - Authorizationヘッダーの形式確認

---

最終更新: 2025-01-29