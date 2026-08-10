from PySide6.QtGui import QTextOption
from PySide6.QtWidgets import QTextEdit
from PySide6.QtCore import Qt

class ChatInput(QTextEdit):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.min_height = 48
        self.max_height = 240 
        self.setFixedHeight(self.min_height)
        self.setAcceptRichText(False)
        self.setWordWrapMode(QTextOption.WrapAtWordBoundaryOrAnywhere)
        self.setLayoutDirection(Qt.RightToLeft)

    def keyPressEvent(self, event):
        if event.key() in (Qt.Key_Return, Qt.Key_Enter):
            if event.modifiers() == Qt.ShiftModifier:
                super().keyPressEvent(event)
            else:
                parent = self.parent()
                if parent and hasattr(parent, "send_message"):
                    parent.send_message()
        else:
            super().keyPressEvent(event)

    def adjust_height(self):
        doc_height = int(self.document().size().height() + 20)
        self.setFixedHeight(max(self.min_height, min(doc_height, self.max_height)))
