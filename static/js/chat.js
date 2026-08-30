
const chatApp = document.getElementById('chatApp');
const emptyHero = document.getElementById('emptyHero');
const form = document.getElementById('chatForm');
const input = document.getElementById('chatInput');
const messages = document.getElementById('messages');
const loading = document.getElementById('aiLoading');
const sendButton = document.getElementById('sendButton');
 
 
// اگر صفحه با حالت خالی بارگذاری شده، فرم رو داخل کادر خوش‌آمدگویی جابه‌جا کن
if (chatApp.classList.contains('is-empty')) {
    emptyHero.appendChild(form);
}
 
function resizeTextarea() {
    const maxHeight = window.innerHeight * 0.30;
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, maxHeight) + "px";
    chatInput.style.overflowY = chatInput.scrollHeight > maxHeight ? "auto" : "hidden";
}
 
 
chatInput.addEventListener("input", resizeTextarea);
window.addEventListener("resize", resizeTextarea);
resizeTextarea();
 
// ---------- دکمه کپی و برچسب زبان برای بلوک‌های کد ----------
const COPY_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
const CHECK_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
 
const LANGUAGE_LABELS = {
    python: "Python", py: "Python",
    java: "Java",
    javascript: "JavaScript", js: "JavaScript",
    typescript: "TypeScript", ts: "TypeScript",
    bash: "Shell", sh: "Shell", shell: "Shell", zsh: "Shell", powershell: "PowerShell",
    json: "JSON",
    html: "HTML", xml: "XML",
    css: "CSS", scss: "SCSS",
    sql: "SQL",
    c: "C", cpp: "C++", "c++": "C++",
    csharp: "C#", "c#": "C#", cs: "C#",
    php: "PHP",
    go: "Go", golang: "Go",
    rust: "Rust", rs: "Rust",
    ruby: "Ruby", rb: "Ruby",
    kotlin: "Kotlin",
    swift: "Swift",
    yaml: "YAML", yml: "YAML",
    dockerfile: "Dockerfile",
    markdown: "Markdown", md: "Markdown",
    plaintext: "متن", text: "متن", txt: "متن"
};
 
// تشخیص زبان از روی کلاس‌های استاندارد markdown مثل language-python / lang-python
function getCodeLanguage(codeEl, preEl) {
    const sources = [codeEl ? codeEl.className : "", preEl.className || ""];
    for (const cls of sources) {
        const match = cls.match(/(?:language|lang)-([a-zA-Z0-9+#]+)/i);
        if (match) {
            return match[1].toLowerCase();
        }
    }
    return null;
}
 
function getLanguageLabel(lang) {
    if (!lang) {
        return "Ai pro";
    }
    return LANGUAGE_LABELS[lang] || (lang.charAt(0).toUpperCase() + lang.slice(1));
}
 
function setupCodeCopyButtons() {
    const codeBlocks = document.querySelectorAll(".message pre");
    codeBlocks.forEach(function (pre) {
        // جلوگیری از اضافه‌شدن دوباره دکمه
        if (
            pre.parentElement &&
            pre.parentElement.classList.contains("code-wrapper")
        ) {
            return;
        }
 
        const codeEl = pre.querySelector("code");
        const lang = getCodeLanguage(codeEl, pre);
 
        // ساخت ظرف کد
        const wrapper = document.createElement("div");
        wrapper.className = "code-wrapper";
        // قرار دادن wrapper قبل از pre
        pre.parentNode.insertBefore(wrapper, pre);
        // انتقال pre داخل wrapper
        wrapper.appendChild(pre);
 
        // برچسب زبان، گوشه‌ی چپ بالا
        const langLabel = document.createElement("span");
        langLabel.className = "code-lang-label";
        langLabel.textContent = getLanguageLabel(lang);
        wrapper.appendChild(langLabel);
 
        // ساخت دکمه کپی، گوشه‌ی راست بالا
        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "copy-code-button";
        copyButton.title = "کپی کد";
        copyButton.setAttribute("aria-label", "کپی کد");
        copyButton.innerHTML = COPY_ICON_SVG;
        wrapper.appendChild(copyButton);
 
        copyButton.addEventListener("click", async function () {
            const code = pre.querySelector("code");
            const codeText = code ? code.innerText : pre.innerText;
            if (!codeText) {
                return;
            }
 
            function showCopied() {
                copyButton.innerHTML = CHECK_ICON_SVG;
                copyButton.classList.add("copied");
                copyButton.title = "کپی شد";
                setTimeout(function () {
                    copyButton.innerHTML = COPY_ICON_SVG;
                    copyButton.classList.remove("copied");
                    copyButton.title = "کپی کد";
                }, 2000);
            }
 
            try {
                await navigator.clipboard.writeText(codeText);
                showCopied();
            } catch (error) {
                // روش جایگزین برای مرورگرهای قدیمی‌تر
                const temporaryTextarea = document.createElement("textarea");
                temporaryTextarea.value = codeText;
                temporaryTextarea.style.position = "fixed";
                temporaryTextarea.style.opacity = "0";
                document.body.appendChild(temporaryTextarea);
                temporaryTextarea.select();
                document.execCommand("copy");
                temporaryTextarea.remove();
                showCopied();
            }
        });
    });
}
 
setupCodeCopyButtons();
 
// ---------- سایدبار (باز/بسته‌شدن در موبایل، انتخاب چت، چت جدید) ----------
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const newChatButton = document.getElementById('newChatButton');
const chatHistoryItems = document.querySelectorAll('.chat-history-item');
const chatRows = document.querySelectorAll('.chat-history-row');
const attachButton = document.getElementById('attachButton');
const attachDropdown = document.getElementById('attachDropdown');
const webImageSearch = document.getElementById('webImageSearch');
 
function openSidebar() {
    sidebar.classList.add('open');
    sidebarBackdrop.classList.add('active');
}
 
function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarBackdrop.classList.remove('active');
}
 
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
        if (sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });
}
 
if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeSidebar);
}
 
function setAttachMenu(open) {
    if (!attachButton || !attachDropdown) return;
    attachDropdown.classList.toggle('open', open);
    attachButton.setAttribute('aria-expanded', String(open));
}
 
if (attachButton) {
    attachButton.addEventListener('click', function (event) {
        event.stopPropagation();
        setAttachMenu(!attachDropdown.classList.contains('open'));
    });
}
 
document.addEventListener('click', function () { setAttachMenu(false); });
if (attachDropdown) attachDropdown.addEventListener('click', function (event) { event.stopPropagation(); });
if (webImageSearch) webImageSearch.addEventListener('click', function () { setAttachMenu(false); input.focus(); });
 
chatRows.forEach(function (row) {
    const item = row.querySelector('.chat-history-item');
    const pinButton = row.querySelector('.pin-action');
    const deleteButton = row.querySelector('.delete-action');
 
    if (pinButton) {
        pinButton.addEventListener('click', function (event) {
            event.stopPropagation();
            row.classList.toggle('pinned');
            pinButton.title = row.classList.contains('pinned') ? 'برداشتن پین' : 'پین کردن';
        });
    }
 
    if (deleteButton) {
        deleteButton.addEventListener('click', function (event) {
            event.stopPropagation();
            row.classList.add('removing');
            setTimeout(function () { row.remove(); }, 220);
        });
    }
 
    if (item) {
        item.addEventListener('click', function () {
            chatHistoryItems.forEach(function (i) { i.classList.remove('active'); });
            item.classList.add('active');
            closeSidebar();
        });
    }
});
 
if (newChatButton) {
    newChatButton.addEventListener('click', function () {
        // فعلاً صفحه رو تازه می‌کنه؛ اگر مسیر جدا برای «چت جدید» داری، اینجا به همون آدرس ریدایرکت کن
        window.location.reload();
    });
}
 
// ارسال پیام با کلید Enter (Shift+Enter برای خط جدید)
chatInput.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") {
        return;
    }
    if (event.shiftKey) {
        // رفتار عادی textarea حفظ می‌شود
        setTimeout(resizeTextarea, 0);
        return;
    }
    event.preventDefault();
    if (form.requestSubmit) {
        form.requestSubmit();
    } else {
        form.submit();
    }
});
 
function exitEmptyState() {
    if (!chatApp.classList.contains('is-empty')) return;
    chatApp.classList.remove('is-empty');
    chatApp.appendChild(form);
}
 
function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = `message ${role}-message`;
    div.innerHTML = `
            <div class="message-text"></div>
            <span class="message-time">${new Date().toLocaleString('fa-IR')}</span>
        `;
    div.querySelector('.message-text').textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
}
 
form.addEventListener('submit', async (e) => {
    e.preventDefault();
 
    const text = input.value.trim();
    if (!text) return;
 
    const formData = new FormData(form);
 
    exitEmptyState();
    addMessage(text, 'user');
    input.value = '';
    loading.style.display = 'flex';
    if (window.startAiLoadingAnimation) window.startAiLoadingAnimation();
    sendButton.disabled = true;
 
    const aiMessageEl = addMessage('', 'ai');
    const aiTextEl = aiMessageEl.querySelector('.message-text');
 
    try {
        const res = await fetch(form.action, {
            method: 'POST',
            body: formData
        });
 
        if (!res.ok || !res.body) {
            throw new Error('Stream error');
        }
 
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';
 
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
 
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            aiTextEl.textContent = fullText;
            messages.scrollTop = messages.scrollHeight;
        }
    } catch (err) {
        aiTextEl.textContent = 'خطا در دریافت پاسخ';
    } finally {
        loading.style.display = 'none';
        if (window.stopAiLoadingAnimation) window.stopAiLoadingAnimation();
        sendButton.disabled = false;
        input.focus();
    }
});
