// ---------- بارگذاری پویای کتابخونه‌های مارک‌داون (برای نمایش زنده‌ی جواب مدل) ----------
// چون در حالت رفرش، جنگو با فیلتر markdownify متن رو به HTML تبدیل می‌کنه،
// اما در حالت استریم زنده (fetch)، این تبدیل باید سمت کلاینت هم انجام بشه،
// وگرنه علامت‌های خام مارک‌داون (**، #، backtick و ...) بدون فرمت نمایش داده می‌شن.
function loadScript(src) {
    return new Promise(function (resolve, reject) {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            if (existing.dataset.loaded === 'true') return resolve();
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', reject);
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = function () {
            script.dataset.loaded = 'true';
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

const markdownLibsReady = Promise.all([
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js'),
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.5/purify.min.js')
]).catch(function (err) {
    console.error('خطا در بارگذاری کتابخونه‌ی مارک‌داون، نمایش به‌صورت متن ساده انجام می‌شود:', err);
});

// تبدیل متن مارک‌داون به HTML امن؛ اگر کتابخونه‌ها لود نشده باشند، متن خام برمی‌گردد
function renderMarkdown(rawText) {
    if (window.marked && window.DOMPurify) {
        const html = window.marked.parse(rawText);
        return window.DOMPurify.sanitize(html);
    }
    // فال‌بک: خروجی متن ساده (بدون فرمت) تا حداقل خطا ندهد
    const div = document.createElement('div');
    div.textContent = rawText;
    return div.innerHTML;
}

// ---------- سوییچ حالت روشن/تاریک ----------
// حالت اولیه (روشن/تاریک) از قبل توسط اسکریپت داخل <head> فایل index.html
// روی <html data-theme="..."> ست شده تا از چشمک‌زدن صفحه جلوگیری بشه.
// این بخش فقط مسئول رفتار کلیک روی دکیمه و ذخیره‌ی انتخاب کاربره.
(function () {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    themeToggle.addEventListener('click', function () {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', next);

        try {
            localStorage.setItem('theme', next);
        } catch (e) {
            // اگر localStorage در دسترس نبود (حالت خصوصی مرورگر و مشابه)،
            // فقط برای همین بار بازدید تغییر اعمال می‌شه و ذخیره نمی‌شه
        }
    });
})();

// ---------- منطق مخصوص صفحه‌ی چت ----------
// این بخش فقط وقتی اجرا می‌شه که عنصر #chatApp توی صفحه وجود داشته باشه؛
// چون chat.js از طریق index.html روی همه‌ی صفحه‌ها (مثل صفحه‌ی تنظیمات) لود
// می‌شه، بدون این گارد، روی صفحاتی که چت توش نیست کرش می‌کرد و باعث می‌شد
// کدهای بعدی (مثل دکمه‌ی تغییر رنگ) هم اجرا نشن.
const chatApp = document.getElementById('chatApp');
if (chatApp) {
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
    // پیام کاربر همیشه متن ساده است (خطر تزریق HTML نداره چون مستقیم از input میاد
    // و innerHTML ست نمی‌کنیم)؛ پیام دستیار ممکنه مارک‌داون داشته باشه که در محل
    // مصرف (حلقه‌ی استریم) جداگانه رندر می‌شه.
    div.querySelector('.message-text').textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function addChatToSidebar(chatId, firstMessageText) {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;

    // اگر این چت از قبل توی لیست هست، دیگه چیزی اضافه نکن
    if (chatHistory.querySelector(`[data-chat-id="${chatId}"]`)) return;

    const placeholder = '00000000-0000-0000-0000-000000000000';
    const pageUrl = (chatHistory.dataset.chatPageTemplate || '').replace(placeholder, chatId);
    const pinUrl = (chatHistory.dataset.pinTemplate || '').replace(placeholder, chatId);
    const deleteUrl = (chatHistory.dataset.deleteTemplate || '').replace(placeholder, chatId);

    // اسم چت دقیقاً مثل سرور: ۲۰ کاراکتر اول پیام
    const chatName = escapeHtml(firstMessageText.slice(0, 20));

    const row = document.createElement('div');
    row.className = 'chat-history-row';
    row.dataset.chatId = chatId;
    row.innerHTML = `
        <button type="button" class="chat-history-item active"><a href="${pageUrl}">${chatName}</a></button>
        <div class="chat-history-actions" aria-label="Chat operations">
            <a href="${pinUrl}?next=${encodeURIComponent(pageUrl)}">
                <button type="button" class="chat-action pin-action" title="Pin" aria-label="Pin">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m12 17 5-5-4-4-5 5"></path>
                        <path d="M8 21l4-4"></path>
                        <path d="M15 3l6 6"></path>
                    </svg>
                </button>
            </a>
            <a href="${deleteUrl}">
                <button type="button" class="chat-action delete-action" title="Delete" aria-label="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 7h16"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                        <path d="M6 7l1 13h10l1-13"></path>
                        <path d="M9 7V4h6v3"></path>
                    </svg>
                </button>
            </a>
        </div>
    `;

    // چت جدید بالای لیست اضافه بشه (بعد از عنوان "Recent chats")
    const label = chatHistory.querySelector('.chat-history-label');
    if (label && label.nextSibling) {
        chatHistory.insertBefore(row, label.nextSibling);
    } else {
        chatHistory.appendChild(row);
    }

    // فعال‌سازی دکمه‌های پین/حذف روی همین ردیف جدید (منطق مشابه ردیف‌های موجود)
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

        // اگر این اولین پیام این چت بود، سرور یک چت جدید ساخته و id آن را
        // در هدر برگردانده. باید action فرم و آدرس صفحه را با همین id
        // به‌روزرسانی کنیم تا پیام‌های بعدی به همین چت اضافه شوند،
        // نه اینکه هر پیام یک چت جدید بسازد.
        const newChatId = res.headers.get('X-Chat-Id');
        if (newChatId && form.dataset.urlTemplate) {
            const placeholder = '00000000-0000-0000-0000-000000000000';
            form.action = form.dataset.urlTemplate.replace(placeholder, newChatId);

            if (form.dataset.pageUrlTemplate) {
                const pageUrl = form.dataset.pageUrlTemplate.replace(placeholder, newChatId);
                history.replaceState({}, '', pageUrl);
            }

            // اگر این چت هنوز توی سایدبار نیست (یعنی همین الان ساخته شده)
            // یک ردیف جدید براش بسازیم، بدون نیاز به رفرش صفحه
            addChatToSidebar(newChatId, text);
        }

        // منتظر بمانیم کتابخونه‌های مارک‌داون لود بشن (معمولاً خیلی سریع، از کش هم لود می‌شه)
        await markdownLibsReady;

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            // در حین استریم هم مارک‌داون رو به HTML تبدیل می‌کنیم تا نمایش زنده
            // دقیقاً همون چیزی باشه که بعد از رفرش صفحه (توسط markdownify سرور) دیده می‌شه
            aiTextEl.innerHTML = renderMarkdown(fullText);
            messages.scrollTop = messages.scrollHeight;
        }

        // بعد از پایان استریم، دکمه‌های کپی کد رو برای بلوک‌های کد جدید فعال کن
        setupCodeCopyButtons();
    } catch (err) {
        aiTextEl.textContent = 'خطا در دریافت پاسخ';
    } finally {
        loading.style.display = 'none';
        if (window.stopAiLoadingAnimation) window.stopAiLoadingAnimation();
        sendButton.disabled = false;
        input.focus();
    }
});
} // پایان گارد if (chatApp) { ... }
(function () {
    const TOTAL_FRAMES = 6;
    const FRAME_INTERVAL_MS = 50;

    const loadingBox = document.getElementById("aiLoading");
    const frameImg = document.getElementById("aiLoadingFrame");

    if (!loadingBox || !frameImg) return;

    const loadingPath = loadingBox.dataset.loadingPath;

    const framePaths = Array.from(
        { length: TOTAL_FRAMES },
        (_, i) => `${loadingPath}loading${i + 1}.svg`
    );

    let timerId = null;
    let currentIndex = 0;

    function startLoadingAnimation() {
        if (timerId) return;

        timerId = setInterval(() => {
            currentIndex = (currentIndex + 1) % TOTAL_FRAMES;
            frameImg.src = framePaths[currentIndex];
        }, FRAME_INTERVAL_MS);
    }

    function stopLoadingAnimation() {
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        }

        currentIndex = 0;
        frameImg.src = framePaths[0];
    }

    window.startAiLoadingAnimation = startLoadingAnimation;
    window.stopAiLoadingAnimation = stopLoadingAnimation;
})();