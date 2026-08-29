import ollama
import psutil


def is_battery_on_charge():
    battery = psutil.sensors_battery()

    if battery is None:
        return {
            "num_thread": 5,
            "num_gpu": 0,
        }

    if battery.power_plugged:
        return {
            "num_thread": 5,
            "num_gpu": 3,
        }

    return {
        "num_thread": 7,
        "num_gpu": 0,
    }


def ai(model, message, tools=None, options=None):
    response = ollama.chat(
        model = model,
        messages = [message],
        tools = tools or [],
        options = options or {},
        stream = True,
    )

    for Character in response:
        yield Character["message"]["content"]