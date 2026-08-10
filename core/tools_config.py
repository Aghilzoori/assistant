from .tools import send_bale_message

OLLAMA_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "send_bale_message",
            "description": "Send a message to Bale messenger.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "Message text"
                    }
                },
                "required": ["text"]
            }
        }
    }
]

TOOLS = {
    "send_bale_message": send_bale_message
}