import ollama
import psutil
import logging

logger = logging.getLogger(__name__)


def get_model_options():
    try:
        battery = psutil.sensors_battery()
    except Exception:
        return {"num_thread": 7, "num_gpu": 0}

    if battery is None:
        return {"num_thread": 5, "num_gpu": 0}
    return {"num_thread": 5, "num_gpu": 3}


def ai_stream(model, message, tools=None, options=None):
    response = ollama.chat(
        model=model,
        messages=[message],
        tools=tools or [],
        options=options or {},
        stream=True
    )

    for chunk in response:
        content = chunk.get("message", {}).get("content", "")
        if content:
            yield content
