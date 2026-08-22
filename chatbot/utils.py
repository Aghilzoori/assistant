import ollama
import psutil

def is_battery_on_charge():
    
    battery = psutil.sensors_battery()
    
    if battery.power_plugged:
        return {
            "num_thread": 5,
            "num_gpu": 3,
        }
    else:
        return {
            "num_thread": 7,
            "num_gpu": 0,
        }

def ai(model, messages, tools, options):
    response = ollama.chat(
        model=model,
        messages=messages,
        tools=tools,
        options=options
    )
    return response