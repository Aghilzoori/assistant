# static/direct_ai_chat.py
from PySide6.QtCore import Qt, QThread, Signal
from PySide6.QtGui import QFont
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QTextBrowser,
    QPushButton, QFrame, QSizePolicy, QLabel, QToolButton
)

from core.tools import ai, is_battery_on_charge
from core.tools_config import OLLAMA_TOOLS
from static.theme import APP_STYLE
from static.chat_style import chat_style
from static.render_utils import (
    sanitize_and_render,
    wrap_bubble,
    escape_user_text
)
from static.chat_input import ChatInput

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
            answer = ai("qwen3:8b", self.messages, OLLAMA_TOOLS, is_battery_on_charge())
            self.finished.emit(answer["message"]["content"])
        except Exception as e:
            self.finished.emit(f"Error: {str(e)}")

class ToolsHeader(QFrame):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("ToolsHeader")

        layout = QHBoxLayout(self)
        layout.setContentsMargins(10, 10, 10, 10)
        layout.setSpacing(10)

        title = QLabel("Assistant")
        title.setStyleSheet("color:#e2e8f0; font-size:16px; font-weight:600;")

        self.ai_btn = QToolButton()
        self.ai_btn.setText("Chat Fast")
        self.ai_btn.setCursor(Qt.PointingHandCursor)
        self.ai_btn.setToolTip("Open direct AI chat")
        self.ai_btn.setStyleSheet("""
            QToolButton {
                color: white;
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 #38bdf8, stop:1 #8b5cf6);
                border: none;
                border-radius: 10px;
                padding: 7px 14px;
                font-weight: 600;
                min-width: 52px;
            }
            QToolButton:hover {
                opacity: 0.9;
            }
        """)

        layout.addWidget(title)
        layout.addStretch()
        layout.addWidget(self.ai_btn)


class DirectAIChat(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Assistant")
        self.resize(920, 780)
        self.setMinimumSize(760, 620)
        self.setStyleSheet(APP_STYLE)
        self.setLayoutDirection(Qt.RightToLeft)

        self.messages = []

        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(18, 18, 18, 18)
        main_layout.setSpacing(14)

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
        self.send_button.clicked.connect(self.send_message)

        bottom_layout.addWidget(self.input_box, 1)
        bottom_layout.addWidget(self.send_button)
        main_layout.addWidget(bottom)

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

        self.messages.append({"role": "user", "content": text})
        self.add_message("You", text, kind="user")

        self.input_box.clear()
        self.input_box.adjust_height()

        self.send_button.setEnabled(False)
        self.input_box.setEnabled(False)

        self.worker = AIWorker(self.messages)
        self.worker.finished.connect(self.on_ai_done)
        self.worker.start()

    def on_ai_done(self, answer):
        self.messages.append({"role": "assistant", "content": answer})
        self.add_message("AI", answer, kind="ai")

        self.send_button.setEnabled(True)
        self.input_box.setEnabled(True)
        self.input_box.setFocus()

    def scroll_bottom(self):
        scrollbar = self.chat_box.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())
