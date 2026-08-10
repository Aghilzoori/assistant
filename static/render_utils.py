import html
import markdown
import bleach

def sanitize_and_render(text):
    md_html = markdown.markdown(
        text,
        extensions=["fenced_code", "tables", "nl2br", "codehilite"]
    )

    allowed_tags = bleach.sanitizer.ALLOWED_TAGS.union({
        "p", "br", "pre", "code", "hr", "span", "div",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "table", "thead", "tbody", "tr", "th", "td",
        "blockquote", "ul", "ol", "li", "strong", "em", "a"
    })

    allowed_attrs = {
        **bleach.sanitizer.ALLOWED_ATTRIBUTES,
        "a": ["href", "title", "target", "rel"],
        "span": ["class"],
        "div": ["class", "dir"],
        "code": ["class"],
        "p": ["dir"],
        "pre": ["dir"],
        "table": ["dir"],
        "th": ["dir"],
        "td": ["dir"],
    }

    clean_html = bleach.clean(md_html, tags=allowed_tags, attributes=allowed_attrs, strip=True)
    return clean_html

def wrap_bubble(sender, body_html, kind="user"):
    cls = "ai" if kind == "ai" else "user"
    return f"""
    <div class="bubble {cls}" dir="rtl">
        <div class="meta" dir="rtl">{html.escape(sender)}</div>
        <div dir="rtl">{body_html}</div>
    </div>
    """

def escape_user_text(text):
    return f'<p dir="rtl">{html.escape(text)}</p>'

def system_message(text):
    return f'<div class="meta" dir="rtl">{html.escape(text)}</div>'
