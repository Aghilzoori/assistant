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

    // پسوند فایل مناسب برای هر زبان، برای اسم‌گذاری فایل دانلودی
    const LANGUAGE_EXTENSIONS = {
        python: "py",
        java: "java",
        javascript: "js",
        typescript: "ts",
        bash: "sh", sh: "sh", shell: "sh", zsh: "sh", powershell: "ps1",
        json: "json",
        html: "html", xml: "xml",
        css: "css", scss: "scss",
        sql: "sql",
        c: "c", cpp: "cpp", "c++": "cpp",
        csharp: "cs", "c#": "cs", cs: "cs",
        php: "php",
        go: "go", golang: "go",
        rust: "rs", rs: "rs",
        ruby: "rb", rb: "rb",
        kotlin: "kt",
        swift: "swift",
        yaml: "yaml", yml: "yaml",
        dockerfile: "Dockerfile",
        markdown: "md", md: "md",
        plaintext: "txt", text: "txt", txt: "txt"
    };

    function getLanguageExtension(lang) {
        if (!lang) return "txt";
        return LANGUAGE_EXTENSIONS[lang] || lang;
    }

    // حداقل تعداد خط برای اینکه یک بلوک کد به‌جای نمایش مستقیم،
    // به‌صورت کارت «فایل» (با دکمه‌ی دانلود و پیش‌نمایش کنار صفحه) نشون داده بشه
    const FILE_CARD_LINE_THRESHOLD = 10;

    const FILE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
    const DOWNLOAD_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
    const CLOSE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    function countLines(text) {
        if (!text) return 0;
        // اگه خط آخر فقط یک enter اضافه‌ست، جزو خطوط واقعی حساب نشه
        const trimmed = text.replace(/\n$/, "");
        return trimmed.length ? trimmed.split("\n").length : 0;
    }

    function downloadTextFile(filename, text) {
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    // ---------- پنل پیش‌نمایش فایل، کنار صفحه ----------
    let filePreviewOverlay, filePreviewPanel, filePreviewNameEl, filePreviewMetaEl,
        filePreviewCodeEl, filePreviewCopyBtn, filePreviewDownloadBtn, filePreviewCloseBtn;
    let currentPreviewText = "";
    let currentPreviewFilename = "";

    function buildFilePreviewPanel() {
        if (filePreviewPanel) return;

        filePreviewOverlay = document.createElement("div");
        filePreviewOverlay.className = "file-preview-overlay";
        filePreviewOverlay.id = "filePreviewOverlay";

        filePreviewPanel = document.createElement("aside");
        filePreviewPanel.className = "file-preview-panel";
        filePreviewPanel.id = "filePreviewPanel";
        filePreviewPanel.setAttribute("aria-label", "پیش‌نمایش فایل");
        filePreviewPanel.innerHTML = `
            <div class="file-preview-header">
                <div class="file-preview-info">
                    <span class="file-preview-icon">${FILE_ICON_SVG}</span>
                    <div class="file-preview-titles">
                        <span class="file-preview-name" id="filePreviewName"></span>
                        <span class="file-preview-meta" id="filePreviewMeta"></span>
                    </div>
                </div>
                <div class="file-preview-actions">
                    <button type="button" class="file-preview-btn" id="filePreviewCopyBtn" title="کپی" aria-label="کپی">${COPY_ICON_SVG}</button>
                    <button type="button" class="file-preview-btn" id="filePreviewDownloadBtn" title="دانلود" aria-label="دانلود">${DOWNLOAD_ICON_SVG}</button>
                    <button type="button" class="file-preview-btn file-preview-close" id="filePreviewCloseBtn" title="بستن" aria-label="بستن">${CLOSE_ICON_SVG}</button>
                </div>
            </div>
            <pre class="file-preview-body"><code id="filePreviewCode"></code></pre>
        `;

        document.body.appendChild(filePreviewOverlay);
        document.body.appendChild(filePreviewPanel);

        filePreviewNameEl = filePreviewPanel.querySelector("#filePreviewName");
        filePreviewMetaEl = filePreviewPanel.querySelector("#filePreviewMeta");
        filePreviewCodeEl = filePreviewPanel.querySelector("#filePreviewCode");
        filePreviewCopyBtn = filePreviewPanel.querySelector("#filePreviewCopyBtn");
        filePreviewDownloadBtn = filePreviewPanel.querySelector("#filePreviewDownloadBtn");
        filePreviewCloseBtn = filePreviewPanel.querySelector("#filePreviewCloseBtn");

        filePreviewOverlay.addEventListener("click", closeFilePreview);
        filePreviewCloseBtn.addEventListener("click", closeFilePreview);

        filePreviewDownloadBtn.addEventListener("click", function () {
            if (!currentPreviewText) return;
            downloadTextFile(currentPreviewFilename, currentPreviewText);
        });

        filePreviewCopyBtn.addEventListener("click", async function () {
            if (!currentPreviewText) return;

            function showCopied() {
                filePreviewCopyBtn.innerHTML = CHECK_ICON_SVG;
                filePreviewCopyBtn.classList.add("copied");
                setTimeout(function () {
                    filePreviewCopyBtn.innerHTML = COPY_ICON_SVG;
                    filePreviewCopyBtn.classList.remove("copied");
                }, 2000);
            }

            try {
                await navigator.clipboard.writeText(currentPreviewText);
                showCopied();
            } catch (error) {
                const temporaryTextarea = document.createElement("textarea");
                temporaryTextarea.value = currentPreviewText;
                temporaryTextarea.style.position = "fixed";
                temporaryTextarea.style.opacity = "0";
                document.body.appendChild(temporaryTextarea);
                temporaryTextarea.select();
                document.execCommand("copy");
                temporaryTextarea.remove();
                showCopied();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && filePreviewPanel.classList.contains("open")) {
                closeFilePreview();
            }
        });
    }

    function openFilePreview(filename, lang, text) {
        buildFilePreviewPanel();
        currentPreviewText = text;
        currentPreviewFilename = filename;

        filePreviewNameEl.textContent = filename;
        filePreviewMetaEl.textContent = `${getLanguageLabel(lang)} · ${countLines(text)} خط`;
        filePreviewCodeEl.textContent = text;

        filePreviewOverlay.classList.add("open");
        filePreviewPanel.classList.add("open");
        document.body.classList.add("file-preview-open");
    }

    function closeFilePreview() {
        if (!filePreviewPanel) return;
        filePreviewOverlay.classList.remove("open");
        filePreviewPanel.classList.remove("open");
        document.body.classList.remove("file-preview-open");
    }

    // شمارنده‌ی سراسری برای اسم‌گذاری فایل‌های تولید شده در همین صفحه
    let fileCardCounter = 0;

    function buildFileCard(lang, codeText, filenameOverride) {
        let filename = filenameOverride;
        if (!filename) {
            fileCardCounter += 1;
            const extension = getLanguageExtension(lang);
            filename = `code-${fileCardCounter}.${extension}`;
        }
        const lineCount = countLines(codeText);

        const card = document.createElement("div");
        card.className = "code-file-card";
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", `نمایش فایل ${filename}`);
        card.innerHTML = `
            <span class="code-file-icon">${FILE_ICON_SVG}</span>
            <span class="code-file-info">
                <span class="code-file-name">${filename}</span>
                <span class="code-file-meta">${getLanguageLabel(lang)} · ${lineCount} خط · برای پیش‌نمایش کلیک کنید</span>
            </span>
            <button type="button" class="code-file-download" title="دانلود فایل" aria-label="دانلود فایل">${DOWNLOAD_ICON_SVG}</button>
        `;

        const downloadBtn = card.querySelector(".code-file-download");
        downloadBtn.addEventListener("click", function (event) {
            event.stopPropagation();
            downloadTextFile(filename, codeText);
        });

        function openPreview() {
            openFilePreview(filename, lang, codeText);
        }

        card.addEventListener("click", openPreview);
        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openPreview();
            }
        });

        return card;
    }

    function setupCodeCopyButtons() {
        const codeBlocks = document.querySelectorAll(".message pre");
        codeBlocks.forEach(function (pre) {
            // جلوگیری از پردازش دوباره
            if (
                pre.parentElement &&
                (pre.parentElement.classList.contains("code-wrapper") ||
                    pre.dataset.fileCardProcessed === "true")
            ) {
                return;
            }

            const codeEl = pre.querySelector("code");
            const lang = getCodeLanguage(codeEl, pre);
            const codeText = codeEl ? codeEl.innerText : pre.innerText;
            const lineCount = countLines(codeText);

            // بلوک‌های کد طولانی: به‌جای نمایش کامل، یک کارت فایل نشون بده
            if (lineCount > FILE_CARD_LINE_THRESHOLD) {
                pre.dataset.fileCardProcessed = "true";
                const card = buildFileCard(lang, codeText);
                pre.parentNode.insertBefore(card, pre);
                pre.style.display = "none"; // متن اصلی نگه داشته می‌شه ولی نمایش داده نمی‌شه
                return;
            }

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
    const webSearchBadge = document.getElementById('webSearchBadge');
    const codeModeToggle = document.getElementById('codeModeToggle');
    const codeModelBadge = document.getElementById('codeModelBadge');

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
    // وضعیت فعال/غیرفعال بودن جستجوی وب؛ تا وقتی خود کاربر دوباره کلیک نکنه،
    // روشن می‌مونه (یعنی برای چند پیام پشت‌سرهم هم فعال باقی می‌مونه، نه فقط یک بار)
    let webSearchEnabled = false;
    let codeModeEnabled = false;

    if (webImageSearch) {
        webImageSearch.addEventListener('click', function () {
            webSearchEnabled = !webSearchEnabled;
            webImageSearch.classList.toggle('is-active', webSearchEnabled);
            if (webSearchBadge) webSearchBadge.classList.toggle('is-visible', webSearchEnabled);
            setAttachMenu(false);
            input.focus();
        });
    }

    // کلیک روی نشونگر جستجوی وب برای خاموش کردن
    if (webSearchBadge) {
        webSearchBadge.addEventListener('click', function () {
            webSearchEnabled = false;
            if (webImageSearch) webImageSearch.classList.remove('is-active');
            webSearchBadge.classList.remove('is-visible');
        });
    }

    // فعال/غیرفعال کردن حالت کدنویسی
    if (codeModeToggle) {
        codeModeToggle.addEventListener('click', function () {
            codeModeEnabled = !codeModeEnabled;
            codeModeToggle.classList.toggle('is-active', codeModeEnabled);
            if (codeModelBadge) codeModelBadge.style.display = codeModeEnabled ? 'flex' : 'none';
            setAttachMenu(false);
            input.focus();
        });
    }

    // کلیک روی نشونگر حالت کدنویسی برای خاموش کردن
    if (codeModelBadge) {
        codeModelBadge.addEventListener('click', function () {
            codeModeEnabled = false;
            if (codeModeToggle) codeModeToggle.classList.remove('is-active');
            codeModelBadge.style.display = 'none';
        });
    }

    // ---------- آپلود فایل (txt, py, css, js, html)، نرمال‌سازی سمت کلاینت و ارسال به سرور ----------
    // چون سمت سرور از Ollama استفاده می‌شه، مدل فقط متن می‌بینه (نه فایل باینری)؛
    // پس فایل رو همینجا با جاوااسکریپت می‌خونیم، تمیز و یکدست می‌کنیم و به‌صورت
    // متن (داخل بلوک کد) به پیام کاربر اضافه می‌کنیم و در قالب یک کارت فایل هم نمایش می‌دیم.
    const fileUploadTrigger = document.getElementById('fileUploadTrigger');
    const fileUploadInput = document.getElementById('fileUploadInput');
    const attachedFilesRow = document.getElementById('attachedFilesRow');

    const ALLOWED_UPLOAD_EXTENSIONS = ['txt', 'py', 'css', 'js', 'html'];
    const EXTENSION_TO_LANGUAGE = { txt: 'plaintext', py: 'python', css: 'css', js: 'javascript', html: 'html' };
    const MAX_UPLOAD_SIZE_BYTES = 300 * 1024; // ۳۰۰ کیلوبایت، برای اینکه پرامپت مدل محلی خیلی سنگین نشه

    let attachedFiles = []; // { name, content, lang }

    function getFileExtension(filename) {
        const match = /\.([a-zA-Z0-9]+)$/.exec(filename || "");
        return match ? match[1].toLowerCase() : "";
    }

    // نرمال‌سازی متن فایل: حذف BOM، یکدست کردن خطوط جدید و پاک کردن فضای خالی اضافه‌ی انتهای فایل
    function normalizeFileText(rawText) {
        let text = rawText;
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }
        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        text = text.replace(/\s+$/, "") + "\n";
        return text;
    }

    function renderAttachedFilesRow() {
        if (!attachedFilesRow) return;
        attachedFilesRow.innerHTML = "";
        attachedFilesRow.classList.toggle("has-files", attachedFiles.length > 0);

        attachedFiles.forEach(function (file, index) {
            const chip = document.createElement("div");
            chip.className = "attached-file-chip";
            chip.innerHTML = `
                <span class="attached-file-chip-icon">${FILE_ICON_SVG}</span>
                <span class="attached-file-chip-name">${escapeHtml(file.name)}</span>
                <button type="button" class="attached-file-chip-remove" aria-label="حذف فایل">${CLOSE_ICON_SVG}</button>
            `;
            chip.querySelector(".attached-file-chip-remove").addEventListener("click", function () {
                attachedFiles.splice(index, 1);
                renderAttachedFilesRow();
            });
            attachedFilesRow.appendChild(chip);
        });
    }

    if (fileUploadTrigger && fileUploadInput) {
        fileUploadTrigger.addEventListener("click", function () {
            fileUploadInput.click();
            setAttachMenu(false);
        });

        fileUploadInput.addEventListener("change", async function () {
            const files = Array.from(fileUploadInput.files || []);

            for (const file of files) {
                const ext = getFileExtension(file.name);

                if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext)) {
                    alert(`فرمت «.${ext}» پشتیبانی نمی‌شه. فقط txt, py, css, js, html مجازه.`);
                    continue;
                }
                if (file.size > MAX_UPLOAD_SIZE_BYTES) {
                    alert(`فایل «${file.name}» خیلی حجیمه (حداکثر ۳۰۰ کیلوبایت).`);
                    continue;
                }

                try {
                    const rawText = await file.text();
                    const normalized = normalizeFileText(rawText);
                    attachedFiles.push({
                        name: file.name,
                        content: normalized,
                        lang: EXTENSION_TO_LANGUAGE[ext] || "plaintext"
                    });
                } catch (err) {
                    console.error("خطا در خوندن فایل:", file.name, err);
                    alert(`خطا در خوندن فایل «${file.name}»`);
                }
            }

            // خالی کردن input تا انتخاب دوباره‌ی همون فایل هم امکان‌پذیر باشه
            fileUploadInput.value = "";
            renderAttachedFilesRow();
        });
    }

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

    function addMessage(text, role, files) {
        const div = document.createElement('div');
        div.className = `message ${role}-message`;
        div.innerHTML = `
            <div class="message-text"></div>
            <span class="message-time">${new Date().toLocaleString('fa-IR')}</span>
        `;
        // پیام کاربر همیشه متن ساده است (خطر تزریق HTML نداره چون مستقیم از input میاد
        // و innerHTML ست نمی‌کنیم)؛ پیام دستیار ممکنه مارک‌داون داشته باشه که در محل
        // مصرف (حلقه‌ی استریم) جداگانه رندر می‌شه.
        const textEl = div.querySelector('.message-text');
        textEl.textContent = text;

        // اگه کاربر فایلی هم ضمیمه کرده بود، برای هر کدوم یک کارت فایل
        // (همون کامپوننتی که برای بلوک‌های کد طولانی استفاده می‌شه) نشون بده
        if (files && files.length) {
            files.forEach(function (file) {
                const card = buildFileCard(file.lang, file.content, file.name);
                textEl.appendChild(card);
            });
        }

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
        if (!text && attachedFiles.length === 0) return;

        // متنی که واقعاً برای سرور (و از اونجا برای Ollama) ارسال می‌شه: پیام کاربر
        // به‌علاوه‌ی محتوای نرمال‌شده‌ی فایل‌های ضمیمه، داخل بلوک کد با نام فایل.
        // چون Ollama فقط متن می‌بینه، نه فایل باینری، محتوا باید همینجا به متن پرامپت اضافه بشه.
        let composedText = text;
        attachedFiles.forEach(function (file) {
            composedText += `\n\n[فایل ضمیمه: ${file.name}]\n\`\`\`${file.lang}\n${file.content}\`\`\``;
        });

        const formData = new FormData(form);
        formData.set('text', composedText);
        if (webSearchEnabled) {
            formData.append('use_web_search', '1');
        }
        if (codeModeEnabled) {
            formData.append('use_code_model', '1');
        }

        const filesToShow = attachedFiles.slice();

        exitEmptyState();
        addMessage(text || 'فایل ارسال شد', 'user', filesToShow);
        input.value = '';
        attachedFiles = [];
        renderAttachedFilesRow();
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
(function () {
    try {
        var saved = localStorage.getItem('theme');
        var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
        // اگر localStorage در دسترس نبود (مثلاً حالت خصوصی مرورگر)، پیش‌فرض روشن بمونه
    }
})();