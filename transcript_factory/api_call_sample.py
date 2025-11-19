import anthropic

client = anthropic.Anthropic(
    # defaults to os.environ.get("ANTHROPIC_API_KEY")
    api_key="my_api_key",
)

# Replace placeholders like {{CALL_DETAILS}} with real values,
# because the SDK does not support variables.
message = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=20000,
    temperature=1,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "You will be generating a realistic call transcript for Frontier communications, a Fiber internet service provider. Generate the call based on the provided call details.\n\n<call_details>\n{{CALL_DETAILS}}\n</call_details>\n\nYour task is to create a believable, detailed call transcript that matches the scenario described in the call details above. The transcript should feel authentic and include natural conversation flow, realistic dialogue, and appropriate context.\n\nHere are the requirements for your transcript:\n\n**Formatting:**\n- The call starts with the \"Agent:\" first greeting the customer. \n- No title or date or timestamps.\n- Start each speaker's line with their role followed by a colon. (\"Customer:\" or \"Agent:\")\n- Add brief action descriptions in parentheses when relevant (e.g., \"(background noise)\", \"(pause)\", \"(typing sounds)\")\n- Use \"...\" to indicate trailing off or hesitation\n- Use \"[inaudible]\" for parts that would be unclear in a real recording\n\n**Content Guidelines:**\n- Make the dialogue sound natural and conversational, including filler words, interruptions, and realistic speech patterns\n- Include appropriate greetings, transitions, and closing remarks\n- Ensure the conversation flows logically and addresses the key points mentioned in the call details\n- Keep the length appropriate for the type of call described (typically 3-10 minutes for most business calls)\n- Include realistic details that would naturally come up in such a conversation\n- Make sure all speakers have distinct voices and speaking styles\n\n**Realism:**\n- Include minor technical issues, brief holds, or other common call experiences if appropriate\n- Add realistic background context or references that would naturally occur\n- Ensure the tone and formality level matches the type of call described\n"
                }
            ]
        }
    ]
)
print(message.content)