# Plants API Testing Guide

## Local Development Setup

```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve get-plants --env-file .env.local
# In another terminal:
supabase functions serve search-plants --env-file .env.local
# In another terminal:
supabase functions serve get-recommended-plants --env-file .env.local
```

## API Endpoints

### 1. Get Plants (No Auth Required)
```bash
# Get all plants
curl -X GET 'http://localhost:54321/functions/v1/get-plants' \
  -H "apikey: YOUR_ANON_KEY"

# With filters
curl -X GET 'http://localhost:54321/functions/v1/get-plants?category=観葉植物&size=M&sort_by=price&sort_order=asc&page=1&limit=10' \
  -H "apikey: YOUR_ANON_KEY"

# Filter by price range
curl -X GET 'http://localhost:54321/functions/v1/get-plants?min_price=1000&max_price=5000' \
  -H "apikey: YOUR_ANON_KEY"
```

### 2. Search Plants (No Auth Required)
```bash
# Search by name
curl -X POST 'http://localhost:54321/functions/v1/search-plants' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "モンステラ"}'

# Search with short query (will fail validation)
curl -X POST 'http://localhost:54321/functions/v1/search-plants' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "a"}'
```

### 3. Get Recommended Plants (Auth Required)
```bash
# First, get an auth token (signup/login required)
# Then use the token:

curl -X POST 'http://localhost:54321/functions/v1/get-recommended-plants' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "room_analysis": {
      "id": "analysis-uuid-here",
      "light_level": "moderate",
      "humidity_level": "normal",
      "temperature_range": "20-25"
    }
  }'

# Without room analysis (will still return popular/beginner plants)
curl -X POST 'http://localhost:54321/functions/v1/get-recommended-plants' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Deploy to Production

```bash
# Deploy all functions
supabase functions deploy get-plants
supabase functions deploy search-plants
supabase functions deploy get-recommended-plants

# Verify deployment
supabase functions list
```

## Expected Responses

### Success Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Test Data Available

The following sample plants are available in the database:
1. モンステラ (Monstera deliciosa) - ¥3,980
2. ポトス (Epipremnum aureum) - ¥1,980
3. サンスベリア (Sansevieria trifasciata) - ¥2,980
4. パキラ (Pachira aquatica) - ¥2,480
5. フィカス・ベンガレンシス (Ficus benghalensis) - ¥4,980