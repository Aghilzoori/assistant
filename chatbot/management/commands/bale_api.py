from django.conf import settings
import requests


last_update_id = None


def send_bale_message(
    text: str,
    chat_id: int,
    parse_mode: str = None
):
    url = f"https://tapi.bale.ai/bot{settings.BOT_TOKEN}/sendMessage"

    data = {
        "chat_id": chat_id,
        "text": text,
    }

    if parse_mode:
        data["parse_mode"] = parse_mode

    response = requests.post(
        url,
        json=data,
        timeout=30
    )

    response.raise_for_status()
    return response.json()


def get_user_messages():
    global last_update_id

    url = f"https://tapi.bale.ai/bot{settings.BOT_TOKEN}/getUpdates"

    params = {}

    if last_update_id is not None:
        params["offset"] = last_update_id + 1

    response = requests.get(
        url,
        params=params,
        timeout=30
    )
    response.raise_for_status()

    result = response.json()

    if not result.get("ok"):
        raise Exception(result)

    for update in result.get("result", []):
        last_update_id = update["update_id"]

        message = update.get("message")

        if not message:
            continue

        user_id = message.get("from", {}).get("id")
        chat_id = message.get("chat", {}).get("id")

        if not user_id or not chat_id:
            continue
        print('*' * 99)
        print("User ID:", user_id)

        send_bale_message(
            text=f"{user_id}",
            chat_id=chat_id,
            parse_mode="Markdown"
        )