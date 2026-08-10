from .config import (BOT_TOKEN, 
                     TARGET_CHAT_ID, 
                     JSON_FILE_ADDRESS, 
                     JSON_FILE_MEMORY_ADDRESS,
                     PROMPT_MEMORY,
)
import requests, json
import ollama
import psutil

def send_bale_message(text: str):
    url = f"https://tapi.bale.ai/bot{BOT_TOKEN}/sendMessage"

    data = {
        "chat_id": TARGET_CHAT_ID,
        "text": text
    }

    r = requests.post(url, json=data)
    r.raise_for_status()

    return "Message sent successfully."

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
def read_datas_json(file):
    try:
        with open(file, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def write_datas_json(file, data, status='w'):
    datas = read_datas_json(file)
    datas.append(data)
    with open(file, status, encoding="utf-8") as f:
        json.dump(datas, f, ensure_ascii=False, indent=2)

def ai(model, messages, tools, options):
    response = ollama.chat(
        model=model,
        messages=messages,
        tools=tools,
        options=options
    )
    return response

class MessageManagement:
    def __init__(self):
        pass
    
    def len_data(self, data):
        len_context = 0
        
        for _ in data:
            len_context += len(_["content"])
        
        return len_context
    
    def delete_message(self, len, data):
        len_delete = len
        
        messages = data
        
        while len_delete > 0:
            len_delete -= len(messages[0]['context'])
            del(messages[0])
            
    
    def status(self):
        messages = read_datas_json(JSON_FILE_ADDRESS)
        
        if self.len_data(messages) < 10000:
            return
        
    def processing(self):
        pass
