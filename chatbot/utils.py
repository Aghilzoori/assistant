import ollama
import psutil
import logging

logger = logging.getLogger(__name__)


# Experimental - for system power management
def get_model_options():
    try:
        battery = psutil.sensors_battery()
    except Exception:
        return {
            "num_thread": 7,
            "num_gpu": 0,
        }
    if battery is None:
        return {
            "num_thread": 5,
            "num_gpu": 0,
        }
    else:
        return {
            "num_thread": 5,
            "num_gpu": 3,
        }


def ai(model, message, tools=None, options=None):
    try:
        response = ollama.chat(
            model=model,
            messages=[message],
            tools=tools or [],
            options=options or {}
        )

        return response.get("message", {}).get("content", "")

    except ollama.ResponseError as e:
        logger.error(f"Ollama error: {e}")
        raise