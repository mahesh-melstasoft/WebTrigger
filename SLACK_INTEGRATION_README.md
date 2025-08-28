# Slack Event Alert System

This document explains how to set up and use the Slack event alert system in WebTrigger.

## Overview

The Slack event alert system automatically sends notifications to your Slack workspace whenever your webhooks are triggered. You'll receive real-time updates about:

- ✅ Successful webhook executions
- ❌ Failed webhook executions
- 📊 Daily statistics and performance metrics
- 🔍 Detailed information about each trigger

## Setup Instructions

### 1. Create a Slack App

1. Go to [Slack Apps](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. Enter your app name (e.g., "WebTrigger Alerts")
4. Select your Slack workspace
5. Click **"Create App"**

### 2. Enable Incoming Webhooks

1. In your app settings, go to **"Features"** → **"Incoming Webhooks"**
2. Toggle **"Activate Incoming Webhooks"** to **On**
3. Click **"Add New Webhook to Workspace"**
4. Select the channel where you want to receive notifications
5. Click **"Allow"** to authorize the webhook
6. Copy the **Webhook URL** (it will look like: `https://hooks.slack.com/services/...`)

### 3. Configure WebTrigger

1. Log in to your WebTrigger account
2. Go to **Settings** → **Slack** tab
3. Paste your Slack webhook URL in the **"Slack Webhook URL"** field
4. Click **"Test Slack Webhook"** to verify the connection
5. Click **"Save Changes"**

## What You'll Receive

### Successful Webhook Notifications

When a webhook executes successfully, you'll receive a message like:

```
✅ Webhook Triggered

Callback: My API Webhook
URL: https://api.example.com/webhook
Time: 2025-08-28 14:30:25
Status: Success

Status Code: 200
Response Time: 245ms

Details:
Called https://api.example.com/webhook, status: 200 | IP: 192.168.1.100 | User-Agent: curl/7.68.0 | Referer: -

Today's Triggers: 15
Success Rate: 93.3%
Avg Response Time: 234ms

User: user@example.com | WebTrigger
```

### Failed Webhook Notifications

When a webhook fails, you'll receive an alert like:

```
❌ Webhook Failed

Callback: My API Webhook
URL: https://api.example.com/webhook
Time: 2025-08-28 14:35:10
Status: Failed

Details:
Failed to call https://api.example.com/webhook: Connection timeout | IP: 192.168.1.100 | User-Agent: curl/7.68.0

Today's Triggers: 16
Success Rate: 87.5%
Avg Response Time: 234ms

User: user@example.com | WebTrigger
```

## Features Included

### 📊 Real-time Statistics
- **Today's Triggers**: Total number of webhook triggers for the current day
- **Success Rate**: Percentage of successful webhook executions
- **Average Response Time**: Mean response time for all webhooks

### 🔍 Detailed Information
- **Callback Name**: The name you gave your webhook
- **URL**: The endpoint that was called
- **Timestamp**: When the webhook was triggered
- **Status Code**: HTTP response code (for successful calls)
- **Response Time**: How long the webhook took to respond
- **Client Info**: IP address, User-Agent, and Referer

### 🎯 Smart Notifications
- **Success Notifications**: Green checkmark for successful executions
- **Failure Alerts**: Red X for failed executions
- **Non-blocking**: Webhook execution continues even if Slack fails
- **Rich Formatting**: Clean, readable Slack message blocks

## Troubleshooting

### Test Button Not Working
- Verify your Slack webhook URL is correct
- Make sure the URL starts with `https://hooks.slack.com/`
- Check that your Slack app has permission to post to the selected channel

### Not Receiving Notifications
- Confirm your webhook URL is saved in WebTrigger settings
- Check that your Slack app is active and has webhook permissions
- Verify the selected Slack channel exists and is accessible

### Webhook Still Works But No Slack Message
- The Slack notification failure won't affect your webhook execution
- Check the server logs for any Slack-related errors
- Verify your webhook URL hasn't expired or been revoked

## Security Notes

- ✅ Webhook URLs are stored securely in your database
- ✅ Only you can view and modify your Slack webhook URL
- ✅ Slack notifications include your email for identification
- ✅ Failed Slack notifications don't break webhook functionality

## Rate Limits

- Slack has rate limits for webhook messages
- WebTrigger includes automatic retry logic for failed Slack sends
- If Slack is temporarily unavailable, notifications will be lost (this is by design to not slow down webhooks)

## Support

If you need help setting up Slack notifications, please contact support or check the WebTrigger documentation.
