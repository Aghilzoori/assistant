import ollama
import psutil
from .models import Messages

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

def len_messages(data):
    len_texts = 0

    for item in data:
        len_texts += len(item["content"])

    return len_texts


def analysis_messages(data, total_length, recent_count=6):
    if len(data) <= recent_count:
        return [], data[:]

    old_messages = data[:-recent_count]
    recent_messages = data[-recent_count:]

    return old_messages, recent_messages


def get_messages(chat_id):
    messages = Messages.objects.filter(chat=chat_id).order_by("id")

    ollama_messages = []

    for message in messages:
        ollama_messages.append({
            "role": message.role,
            "content": message.text,
        })

    total_length = len_messages(ollama_messages)

    if total_length <= 10000:
        return ollama_messages

    data_old, data_recent = analysis_messages(
        ollama_messages,
        total_length,
        recent_count=6,
    )

    system = {
        "role": "system",
        "content": """
متن‌های زیر بخشی از تاریخچه‌ی قدیمی گفتگو هستند.
آن‌ها را تا جای ممکن کوتاه و دقیق خلاصه کن.

اطلاعات مهم، هدف کاربر، تصمیم‌ها و کارهای باقی‌مانده را حفظ کن.
فقط متن خلاصه را برگردان.
"""
    }

    summarizing = ai(
        model="qwen3:8b",
        messages=[system] + data_old,
        options=is_battery_on_charge(),
    )

    summary_message = {
        "role": "system",
        "content": f"""
خلاصه‌ی پیام‌های قدیمی این گفتگو:

{summarizing}
"""
    }

    return [summary_message] + data_recent


def ai(model, message, tools=None, options=None):
    response = ollama.chat(
        model = model,
        messages = message,
        tools = tools or [],
        options = options or {},
        stream = True,
    )

    for Character in response:
        yield Character["message"]["content"]