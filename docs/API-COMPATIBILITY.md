# Princy API Compatibility

Gateway base: `http://13.140.129.77:3407`

## OpenAI-compatible (`/v1/*`)

### List models

```bash
curl -s http://13.140.129.77:3407/v1/models
```

### Chat completions

```bash
curl -s http://13.140.129.77:3407/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:3b",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Princy `/api/*` (extension endpoints)

Auth header: `Authorization: Bearer <accessToken>`

### Auth

```bash
curl -s -X POST http://13.140.129.77:3407/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'
```

### Chat stream (SSE)

```bash
curl -N -X POST http://13.140.129.77:3407/api/chat/stream \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain recursion"}'
```

### Ghost text

```bash
curl -s -X POST http://13.140.129.77:3407/api/code/ghost-text \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prefix":"function add(a, b) {\n  ret","language":"typescript"}'
```

### Code fix

```bash
curl -s -X POST http://13.140.129.77:3407/api/code/fix \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"const x = ;","error":"Unexpected token","language":"javascript"}'
```

### Workspace link / index

```bash
curl -s -X POST http://13.140.129.77:3407/api/workspace/link \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"localPath":"/path/to/project"}'

curl -s -X POST http://13.140.129.77:3407/api/workspace/index \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"localPath":"/path/to/project"}'
```

### Terminal IA

```bash
curl -s -X POST http://13.140.129.77:3407/api/terminal/explain-error \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"output":"Error: Cannot find module '\''foo'\''"}'
```

### Patch

```bash
curl -s -X POST http://13.140.129.77:3407/api/patch/preview-id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"patchId":"<id>"}'
```

## Route verification

```bash
npm run verify-routes
```

Expects gateway health, OpenAI models, and auth-protected routes returning 401/403 without token.
