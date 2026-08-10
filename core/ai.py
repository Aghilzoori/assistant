from .tools_config import TOOLS, OLLAMA_TOOLS
from .tools import write_datas_json, ai, read_datas_json, is_battery_on_charge
from .config import JSON_FILE_ADDRESS


def chat_bot(message):

    write_datas_json(JSON_FILE_ADDRESS, {"role": "user", "content": message})

    for _ in range(5):

        response = ai("qwen3:8b", read_datas_json(JSON_FILE_ADDRESS), OLLAMA_TOOLS, is_battery_on_charge())

        message = response["message"]

        tool_calls = message.get("tool_calls")

        if tool_calls:

            for call in tool_calls:

                name = call["function"]["name"]
                arguments = call["function"]["arguments"]

                result = TOOLS[name](**arguments)

                print("Tool:", result)

                write_datas_json(JSON_FILE_ADDRESS ,{'role':message['role'], 'content':message['content']})

                write_datas_json(JSON_FILE_ADDRESS ,{
                    "role": "tool",
                    "name": name,
                    "content": result,
                })

            continue

        write_datas_json(JSON_FILE_ADDRESS ,{'role':message['role'], 'content':message['content']})
         
        return message["content"]


