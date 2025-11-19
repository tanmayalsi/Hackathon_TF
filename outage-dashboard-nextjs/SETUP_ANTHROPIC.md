# Setting Up Anthropic API for Outage Explorer

## Quick Setup

1. **Get an Anthropic API Key**
   - Visit: https://console.anthropic.com/
   - Sign up or log in
   - Go to "API Keys" section
   - Click "Create Key"
   - Copy your new API key

2. **Add to Environment**
   - In the `outage-dashboard-nextjs` directory, create a file named `.env.local`
   - Add this line (replace with your actual key):
     ```
     ANTHROPIC_API_KEY=sk-ant-api03-...your-key-here...
     ```

3. **Restart Server**
   - Stop your Next.js dev server (Ctrl+C)
   - Start it again:
     ```bash
     npm run dev
     ```

4. **Test the Feature**
   - Open the dashboard
   - Click on an outage marker on the map
   - Click "Explore outage"
   - Try asking Claude a question about the calls

## Troubleshooting

### "AI service not configured" error
- Check that `.env.local` exists in the `outage-dashboard-nextjs` folder
- Verify the API key is correctly formatted (starts with `sk-ant-api03-`)
- Make sure you restarted the dev server after adding the key

### "AI service error" in chat
- Verify your API key is valid and active in the Anthropic console
- Check that you have API credits/quota available
- Look at the browser console and server logs for detailed error messages

### Chat not responding
- Check browser console for network errors
- Verify the `/api/outage-chat` endpoint is accessible
- Ensure transcripts are loading (check the transcript list above the chat)

## API Usage Notes

- The feature uses Claude 3.5 Haiku model
- Each chat message costs approximately $0.001-0.003 depending on context size
- Transcripts are automatically truncated to manage token usage
- Maximum 50 transcripts per outage are sent to Claude

## Security Best Practices

- ✅ Never commit `.env.local` to git (it's in `.gitignore` by default)
- ✅ Don't share your API key publicly
- ✅ Rotate your key if it's accidentally exposed
- ✅ Set up usage limits in the Anthropic console if needed

