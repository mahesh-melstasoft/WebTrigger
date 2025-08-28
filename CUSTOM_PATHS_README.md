# Custom Trigger Paths

This application now supports custom trigger paths for webhook callbacks. Users can assign unique custom URLs to trigger their webhooks instead of using the default token-based URLs.

## Features

- **Custom Path Assignment**: Users can optionally assign custom paths when creating or editing callbacks
- **Unique Paths**: Custom paths must be unique across all users
- **Path Validation**: Only alphanumeric characters, hyphens, and underscores are allowed
- **Dual URLs**: Callbacks can have both token-based and custom path URLs
- **Easy Management**: Custom paths can be added, updated, or removed through the dashboard

## API Endpoints

### Custom Path Trigger
```
GET /api/trigger/custom/[path]
```
Triggers a callback using a custom path instead of a token.

### Create/Update Callback with Custom Path
```json
POST /api/callbacks
{
  "name": "My Callback",
  "callbackUrl": "https://example.com/webhook",
  "activeStatus": true,
  "customPath": "my-custom-trigger"
}
```

## Usage Examples

### Creating a callback with custom path:
```bash
curl -X POST http://localhost:3000/api/callbacks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Order Webhook",
    "callbackUrl": "https://api.myshop.com/webhooks/orders",
    "customPath": "new-order"
  }'
```

### Triggering via custom path:
```bash
curl http://localhost:3000/api/trigger/custom/new-order
```

### Triggering via token (still works):
```bash
curl http://localhost:3000/api/trigger/token/[token]
```

## Path Requirements

- **Format**: Only letters, numbers, hyphens (-), and underscores (_) allowed
- **Uniqueness**: Each custom path must be unique across all users
- **Optional**: Custom paths are optional - callbacks work with token URLs even without custom paths
- **Length**: No specific length limit, but keep them reasonable for usability

## Benefits

1. **User-Friendly URLs**: Custom paths are more memorable and user-friendly
2. **Better Integration**: Easier to integrate with external systems
3. **Backward Compatible**: Existing token-based URLs continue to work
4. **Flexible**: Users can choose between token URLs, custom paths, or both</content>
<parameter name="filePath">g:/Projects/nodejs/deploy-web/CUSTOM_PATHS_README.md
