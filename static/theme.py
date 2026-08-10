APP_STYLE = """
QWidget {
    background: #0f172a;
    color: #e2e8f0;
    font-family: "Segoe UI", "Vazirmatn", "IRANSans", sans-serif;
    font-size: 15px;
}
QLineEdit {
    background: #111827;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 14px 16px;
    color: #f8fafc;
    selection-background-color: #38bdf8;
}
QLineEdit:focus {
    border: 1px solid #38bdf8;
}
QPushButton {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                                stop:0 #38bdf8, stop:1 #8b5cf6);
    color: white;
    border: none;
    border-radius: 16px;
    padding: 13px 22px;
    font-weight: 700;
}
QPushButton:hover {
    opacity: 0.95;
}
QPushButton:pressed {
    background: #2563eb;
}
QTextBrowser {
    background: #0b1220;
    border: 1px solid #1e293b;
    border-radius: 22px;
    padding: 14px;
}
QFrame {
    background: rgba(15, 23, 42, 0.92);
    border: 1px solid #1e293b;
    border-radius: 20px;
}
QTextEdit {
    background: #111827;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 14px 16px;
    color: #f8fafc;
    selection-background-color: #38bdf8;
}
QTextEdit:focus {
    border: 1px solid #38bdf8;
}

"""