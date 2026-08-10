import sys
from core.ai import chat_bot
from PySide6.QtCore import QThread, Signal, Qt
from PySide6.QtGui import QFont
from PySide6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout,
    QTextBrowser, QPushButton, QFrame, QSizePolicy
)
from static.theme import APP_STYLE
from static.chat_style import chat_style
from static.render_utils import (
    sanitize_and_render,
    wrap_bubble,
    escape_user_text
)
from core.config import JSON_FILE_ADDRESS
from core.tools import read_datas_json
from static.chat_input import ChatInput
from static.direct_ai_chat import DirectAIChat, ToolsHeader
try:
    from pygments.formatters import HtmlFormatter
    CODE_HIGHLIGHT_CSS = HtmlFormatter().get_style_defs('.codehilite')
except Exception:
    CODE_HIGHLIGHT_CSS = ""


class AIWorker(QThread):
    finished = Signal(str)

    def __init__(self, messages):
        super().__init__()
        self.messages = messages

    def run(self):
        try:
            answer = chat_bot(self.messages[-1]["content"])
            self.finished.emit(answer)
        except Exception as e:
            self.finished.emit(f"Error: {str(e)}")

class ChatApp(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Assistant")
        self.resize(920, 780)
        self.setMinimumSize(760, 620)
        self.setStyleSheet(APP_STYLE)

        self.setLayoutDirection(Qt.RightToLeft)

        self.history_file = JSON_FILE_ADDRESS
        self.messages = read_datas_json(self.history_file)

        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(18, 18, 18, 18)
        main_layout.setSpacing(14)

        self.tools_header = ToolsHeader()
        self.tools_header.ai_btn.clicked.connect(self.open_direct_ai_chat)
        main_layout.insertWidget(0, self.tools_header)

        self.chat_box = QTextBrowser()
        self.chat_box.setOpenExternalLinks(True)
        self.chat_box.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.chat_box.setFont(QFont("Segoe UI", 11))
        self.chat_box.setStyleSheet(chat_style(CODE_HIGHLIGHT_CSS))
        self.chat_box.setLayoutDirection(Qt.RightToLeft)
        main_layout.addWidget(self.chat_box, 1)

        bottom = QFrame()
        bottom_layout = QHBoxLayout(bottom)
        bottom_layout.setContentsMargins(14, 14, 14, 14)
        bottom_layout.setSpacing(12)

        self.input_box = ChatInput(self)
        self.input_box.textChanged.connect(self.input_box.adjust_height)

        self.send_button = QPushButton("Send")
        self.send_button.setMinimumHeight(48)
        self.send_button.setMinimumWidth(120)

        bottom_layout.addWidget(self.input_box, 1)
        bottom_layout.addWidget(self.send_button)
        main_layout.addWidget(bottom)

        self.send_button.clicked.connect(self.send_message)

        self.load_chat()


    def load_chat(self):
        self.chat_box.clear()

        for msg in self.messages:
            content = msg["content"]

            if isinstance(content, list):
                continue

            if msg["role"] == "user":
                self.add_message("You", content, kind="user")
            elif msg["role"] == "assistant":
                self.add_message("AI", content, kind="ai")

    def add_message(self, sender, text, kind="user"):
        if kind == "ai":
            body_html = sanitize_and_render(text)
        else:
            body_html = escape_user_text(text)

        self.chat_box.append(wrap_bubble(sender, body_html, kind))
        self.scroll_bottom()

    def send_message(self):
        text = self.input_box.toPlainText().strip()
        if not text:
            return

        user_msg = {"role": "user", "content": text}
        self.messages.append(user_msg)

        self.add_message("You", text, kind="user")
        self.input_box.clear()
        self.input_box.adjust_height()

        self.send_button.setEnabled(False)
        self.input_box.setEnabled(False)

        self.worker = AIWorker(self.messages)
        self.worker.finished.connect(self.on_ai_done)
        self.worker.start()

    def on_ai_done(self, answer):
        ai_msg = {"role": "assistant", "content": answer}
        self.messages.append(ai_msg)

        self.add_message("AI", answer, kind="ai")

        self.send_button.setEnabled(True)
        self.input_box.setEnabled(True)
        self.input_box.setFocus()

    def scroll_bottom(self):
        scrollbar = self.chat_box.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())
    
    def open_direct_ai_chat(self):
        self.ai_dialog = DirectAIChat(self)
        self.ai_dialog.show()



if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    window = ChatApp()
    window.show()
    sys.exit(app.exec())
