import ollama
import psutil
import asyncio
import requests
import trafilatura
from ddgs import DDGS
from .models import Messages
from .exceptions import SearchRequestError

DEFAULT_MODEL = "qwen3:8b"
RECENT_MESSAGES_COUNT = 6
MAX_CONTEXT_CHARACTERS = 10000

SYSTEM_PROMPT = {
    "role": "system",
    "content": """
متن‌های زیر بخشی از تاریخچه‌ی قدیمی گفتگو هستند.
آن‌ها را تا جای ممکن کوتاه و دقیق خلاصه کن.
اطلاعات مهم، هدف کاربر، تصمیم‌ها و کارهای باقی‌مانده را حفظ کن.
فقط متن خلاصه را برگردان.
"""
}

def get_optimal_compute_config():
    battery = psutil.sensors_battery()
    if battery and battery.power_plugged:
        return None
    return {"num_thread": 5, "num_gpu": 0}

def stream_chat_completion(model, messages, tools=None, options=None):
    response = ollama.chat(
        model=model,
        messages=messages,
        tools=tools or [],
        options=options or {},
        stream=True,
    )
    for chunk in response:
        yield chunk["message"]["content"]

def get_messages(chat_id):
    messages = Messages.objects.filter(chat=chat_id)
    return [{"role": msg.role, "content": msg.text} for msg in messages]

class HistoryCompressor:
    @staticmethod
    def calculate_total_text_length(messages_data):
        return sum(len(item["content"]) for item in messages_data)

    @staticmethod
    def split_by_time(messages_data, recent_count=RECENT_MESSAGES_COUNT):
        if len(messages_data) <= recent_count:
            return [], messages_data[:]
        return messages_data[:-recent_count], messages_data[-recent_count:]

    @staticmethod
    def is_length_exceeding_limit(total_length, limit=MAX_CONTEXT_CHARACTERS):
        return total_length > limit

    @classmethod
    def generate_summary(cls, model, messages, options):
        full_summary = "".join(stream_chat_completion(model, messages, options=options))
        return {
            "role": "system",
            "content": f"خلاصه‌ی پیام‌های قدیمی این گفتگو:\n\n{full_summary}"
        }

    @classmethod
    def compress(cls, chat_id):
        raw_messages = get_messages(chat_id)
        total_len = cls.calculate_total_text_length(raw_messages)

        if not cls.is_length_exceeding_limit(total_len):
            return raw_messages

        old_part, recent_part = cls.split_by_time(raw_messages)
        summary_msg = cls.generate_summary(DEFAULT_MODEL, [SYSTEM_PROMPT] + old_part, get_optimal_compute_config())
        
        return [summary_msg] + recent_part

class WebSearch:
    async def search(self, query, max_results=10):
        return await asyncio.to_thread(self._sync_search, query, max_results)

    def _sync_search(self, query, max_results):
        with DDGS() as ddgs:
            return list(ddgs.text(query, max_results=max_results))

    async def extract_content(self, url: str):
        def _extract():
            try:
                response = requests.get(
                    url,
                    headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"},
                    timeout=15
                )
                response.raise_for_status()
                return trafilatura.extract(response.text, include_comments=False, include_tables=True)
            except Exception:
                return None

        content = await asyncio.to_thread(_extract)
        return content.strip() if content else None

    async def handle_user_query(self, subject: str):
        results = await self.search(subject, max_results=3)
        if not results:
            raise SearchRequestError("No search results found.")

        output = []
        for item in results:
            url = item.get("href")
            if not url:
                continue
            content = await self.extract_content(url)
            if content:
                output.append({
                    "title": item.get("title", ""),
                    "href": url,
                    "body": content,
                })
        return output