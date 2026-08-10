def chat_style(code_highlight_css=""):
    return f"""
        QTextBrowser {{
            color: #e2e8f0;
            background: #0b1220;
            border: none;
            direction: rtl;
            text-align: right;
        }}
        .bubble {{
            border-radius: 18px;
            padding: 14px 16px;
            margin: 10px 2px;
            direction: rtl;
            text-align: right;
        }}
        .user {{
            background: #1e293b;
            border: 1px solid #334155;
        }}
        .ai {{
            background: #111827;
            border: 1px solid #2563eb;
        }}
        .meta {{
            color: #94a3b8;
            font-size: 12px;
            margin-bottom: 6px;
            direction: rtl;
            text-align: right;
        }}
        p, div, li, td, th {{
            direction: rtl;
            text-align: right;
            unicode-bidi: plaintext;
        }}
        pre {{
            background: #020617;
            color: #e2e8f0;
            padding: 12px;
            border-radius: 12px;
            overflow-x: auto;
            white-space: pre-wrap;
            direction: ltr;
            text-align: left;
        }}
        code {{
            background: rgba(148, 163, 184, 0.12);
            padding: 2px 5px;
            border-radius: 6px;
            font-family: Consolas, monospace;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            direction: rtl;
        }}
        th, td {{
            border: 1px solid #334155;
            padding: 8px 10px;
            text-align: right;
        }}
        th {{
            background: #1e293b;
        }}
        {code_highlight_css}
    """