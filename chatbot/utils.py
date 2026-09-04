import ollama
import psutil
from .models import Messages
import asyncio
from ddgs import DDGS
import requests
import trafilatura

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

class AsyncDDGS:
    async def text(self, query, max_results=10):
        return await asyncio.to_thread(
            self._sync_text,
            query,
            max_results
        )

    def _sync_text(self, query, max_results):
        try:
            with DDGS() as ddgs:
                results = list(
                    ddgs.text(
                        query,
                        max_results=max_results
                    )
                )

                print("Search results:", results)

                return results

        except Exception as error:
            print("Search error:", repr(error))
            return []

async def extract_content_async(url: str):
    def sync_extract():
        try:
            response = requests.get(
                url,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 "
                        "(X11; Linux x86_64) "
                        "AppleWebKit/537.36 "
                        "Chrome/120 Safari/537.36"
                    )
                },
                timeout=15
            )

            response.raise_for_status()

            content = trafilatura.extract(
                response.text,
                include_comments=False,
                include_tables=True
            )

            return content.strip() if content else None

        except Exception as error:
            print(f"خطا در استخراج {url}: {repr(error)}")
            return None

    return await asyncio.to_thread(sync_extract)



ddgs = AsyncDDGS()


async def ai_web(subject: str):
    result = []

    result_search = await ddgs.text(
        subject,
        max_results=3
    )

    if not result_search:
        print("No search result found.")
        return result

    for item in result_search:
        url = item.get("href")

        if not url:
            continue

        content = await extract_content_async(url)

        if content:
            result.append({
                "title": item.get("title", ""),
                "href": url,
                "body": content,
            })

    return result

