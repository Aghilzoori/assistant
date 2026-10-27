// ---------- Dynamic loading of Markdown libraries (for live display of the model's reply) ----------
// On page refresh, Django converts the text to HTML with the markdownify filter,
// but in live streaming mode (fetch), this conversion must also happen on the client side,
// otherwise raw Markdown symbols (**, #, backticks, etc.) are displayed unformatted.
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
    console.error('Error loading the Markdown library, falling back to plain text display:', err);
});

// Syntax highlighting library (optional: if it fails to load, code is simply shown without colours)
const highlightLibReady = loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js')
.catch(function (err) {
    console.error('Error loading the highlighting library, code will be shown without colours:', err);
});

// Convert Markdown text to safe HTML; if the libraries haven't loaded, return the raw text
function renderMarkdown(rawText) {
    if (window.marked && window.DOMPurify) {
        const html = window.marked.parse(rawText);
        return window.DOMPurify.sanitize(html);
    }
    // Fallback: plain text output (no formatting) so that at least it doesn't throw an error
    const div = document.createElement('div');
    div.textContent = rawText;
    return div.innerHTML;
}

// ---------- Light/dark mode switch ----------
// The initial mode (light/dark) is already set on <html data-theme="..."> by the script
// inside the <head> of index.html to prevent page flicker.
// This section is only responsible for the button click behavior and saving the user's choice.
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
            // If localStorage is unavailable (private browsing mode and similar),
            // the change only applies for this visit and is not saved
        }
    });
})();

// ---------- Chat page specific logic ----------
// This section only runs when the #chatApp element exists on the page;
// because chat.js is loaded through index.html on all pages (like the settings page),
// without this guard it would crash on pages that have no chat, which would also
// prevent the later code (like the theme toggle button) from running.
const chatApp = document.getElementById('chatApp');
if (chatApp) {
    const emptyHero = document.getElementById('emptyHero');
    const form = document.getElementById('chatForm');
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('messages');
    const loading = document.getElementById('aiLoading');
    const sendButton = document.getElementById('sendButton');


    // If the page loaded in the empty state, move the form into the welcome box
    if (chatApp.classList.contains('is-empty')) {
        emptyHero.appendChild(form);
    }

    function resizeTextarea() {
        const maxHeight = window.innerHeight * 0.30;
        chatInput.style.height = "auto";
        chatInput.style.height = Math.min(chatInput.scrollHeight, maxHeight) + "px";
        chatInput.style.overflowY = chatInput.scrollHeight > maxHeight ? "auto" : "hidden";
    }


    // ---------- Smart auto-scroll ----------
    // While the model is answering, the view only follows the new text if the user is already
    // at (or near) the bottom. As soon as the user scrolls up, we stop forcing the view down,
    // so they can read older messages. Scrolling back to the bottom turns following on again.
    let autoScroll = true;
    const SCROLL_BOTTOM_THRESHOLD = 80; // px

    function isNearBottom() {
        return messages.scrollHeight - messages.scrollTop - messages.clientHeight < SCROLL_BOTTOM_THRESHOLD;
    }

    function scrollToBottomIfFollowing() {
        if (autoScroll) {
            messages.scrollTop = messages.scrollHeight;
        }
    }

    messages.addEventListener('scroll', function () {
        autoScroll = isNearBottom();
    }, { passive: true });

    // Stop following immediately when the user scrolls up with the wheel / touch
    messages.addEventListener('wheel', function (event) {
        if (event.deltaY < 0) autoScroll = false;
    }, { passive: true });

        chatInput.addEventListener("input", resizeTextarea);
        window.addEventListener("resize", resizeTextarea);
        resizeTextarea();

        // ---------- Copy button and language label for code blocks ----------
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
            plaintext: "Text", text: "Text", txt: "Text",
            docx: "Word", xlsx: "Excel", pptx: "PowerPoint", pdf: "PDF"
        };

        // Detect the language from standard markdown classes like language-python / lang-python
        // Guess the language from the code itself. Used when the HTML has no language class, which
        // happens after a page refresh (the server's markdown/sanitizer may drop `language-xxx`).
        function guessLanguageFromContent(text) {
            const t = (text || "").trim();
            if (!t) return "plaintext";
            const head = t.slice(0, 4000);

            if (/^<\?php/.test(head)) return "php";
            if (/^<!doctype html|^<html[\s>]/i.test(head)) return "html";
            if (/^#!.*\b(ba|z)?sh\b/.test(head)) return "bash";
            if (/^#!.*python/.test(head)) return "python";

            if (/^[\[{]/.test(head) && t.length < 200000) {
                try { JSON.parse(t); return "json"; } catch (e) { /* not JSON */ }
            }

            if (/^\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+(TABLE|DATABASE|INDEX)|ALTER\s+TABLE|DROP\s+TABLE)\b/im.test(head)) return "sql";
            if (/^\s*#include\s*[<"]/m.test(head)) return "cpp";
            if (/\bpublic\s+(static\s+)?(class|void|interface)\b|System\.out\.print/.test(head)) return "java";
            if (/\busing\s+System\b|\bnamespace\s+\w+/.test(head)) return "csharp";
            if (/^\s*package\s+main\b|\bfunc\s+\w+\s*\(/m.test(head)) return "go";
                if (/\bfn\s+\w+\s*\(|\blet\s+mut\b/.test(head)) return "rust";

                    if (/^\s*(def\s+\w+\s*\(|class\s+\w+.*:\s*$|import\s+[\w.]+\s*$|from\s+[\w.]+\s+import\s|if\s+__name__\s*==|print\()/m.test(head)) return "python";
                              if (/\b(const|let|var)\s+[\w$]+\s*=|\bfunction\s*[\w$]*\s*\(|=>\s*[{(]|console\.\w+\(|document\.\w+|require\(|^\s*import\s.+\sfrom\s['"]/m.test(head)) {
                                  return /:\s*(string|number|boolean)\b|\binterface\s+\w+\s*\{/.test(head) ? "typescript" : "javascript";
                                  }
                                  if (/<\/?[a-z][\w-]*(\s[^>]*)?>/i.test(head) && /<\/[a-z][\w-]*>|\/>/i.test(head)) return "html";
                                                                                                                   if (/(^|\})\s*[.#@]?[\w\-\s,:>.#]+\{\s*[\w-]+\s*:[^}]*;/m.test(head)) return "css";
                                                                                                                   if (/^\s*(sudo |apt(-get)? |npm |pip3? |git |cd |ls\b|mkdir |echo |chmod |curl |\$ )/m.test(head)) return "bash";

                                                                                                                   return "plaintext";
                              }

                              function getCodeLanguage(codeEl, preEl) {
                                  // 1) language class on <code>, <pre> or a wrapper around them (language-xxx / lang-xxx / highlight-xxx)
                                  const wrapper = preEl.parentElement;
                                  const sources = [
                                      codeEl ? codeEl.className : "",
                                      preEl.className || "",
                                      wrapper && wrapper.className ? wrapper.className : ""
                                  ];
                                  for (const cls of sources) {
                                      const match = String(cls).match(/(?:language|lang|highlight)-([a-zA-Z0-9+#]+)/i);
                                      if (match) {
                                          return match[1].toLowerCase();
                                      }
                                  }
                                  // 2) data attributes
                                  const dataLang = (codeEl && (codeEl.dataset.lang || codeEl.dataset.language)) ||
                                  preEl.dataset.lang || preEl.dataset.language;
                                  if (dataLang) return dataLang.toLowerCase();

                                                                                                                   // 3) guess from the content
                                                                                                                   return guessLanguageFromContent(codeEl ? codeEl.textContent : preEl.textContent);
                              }

                              function getLanguageLabel(lang) {
                                  if (!lang) {
                                      return "Text";
                                  }
                                  return LANGUAGE_LABELS[lang] || (lang.charAt(0).toUpperCase() + lang.slice(1));
                              }

                              // Appropriate file extension for each language, used for naming the downloaded file
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
                                  plaintext: "txt", text: "txt", txt: "txt",
                                  docx: "docx", xlsx: "xlsx", pptx: "pptx", pdf: "pdf"
                              };

                              // Default file name for each type of code (python -> python.py, css -> style.css, ...)
                              const DEFAULT_FILE_NAMES = {
                                  python: "python.py", py: "python.py",
                                  javascript: "script.js", js: "script.js",
                                  typescript: "script.ts", ts: "script.ts",
                                  html: "index.html", xml: "data.xml",
                                  css: "style.css", scss: "style.scss",
                                  json: "data.json",
                                  yaml: "config.yaml", yml: "config.yaml",
                                  sql: "query.sql",
                                  bash: "script.sh", sh: "script.sh", shell: "script.sh", zsh: "script.sh",
                                  powershell: "script.ps1",
                                  java: "Main.java", kotlin: "Main.kt", swift: "main.swift",
                                  c: "main.c", cpp: "main.cpp", "c++": "main.cpp",
                                  csharp: "Program.cs", "c#": "Program.cs", cs: "Program.cs",
                                  php: "index.php",
                                  go: "main.go", golang: "main.go",
                                  rust: "main.rs", rs: "main.rs",
                                  ruby: "main.rb", rb: "main.rb",
                                  markdown: "document.md", md: "document.md",
                                  dockerfile: "Dockerfile",
                                  plaintext: "text.txt", text: "text.txt", txt: "text.txt",
                                  docx: "document.docx", xlsx: "sheet.xlsx", pptx: "slides.pptx", pdf: "document.pdf"
                              };

                              // Returns a name like "python.py". If the same name was already used inside the same
                              // message, a number is added: "python-2.py", "python-3.py", ...
                              const usedFileNames = new WeakMap();

                              function getDefaultFileName(lang, scopeEl) {
                                  const base = DEFAULT_FILE_NAMES[(lang || "").toLowerCase()] || ("code." + getLanguageExtension(lang));
                                  const scope = scopeEl || document.body;
                                  let counts = usedFileNames.get(scope);
                                  if (!counts) {
                                      counts = {};
                                      usedFileNames.set(scope, counts);
                                  }
                                  counts[base] = (counts[base] || 0) + 1;
                                  if (counts[base] === 1) return base;

                                                                                                                   const dot = base.lastIndexOf(".");
                                  return dot > 0
                                  ? `${base.slice(0, dot)}-${counts[base]}${base.slice(dot)}`
                                  : `${base}-${counts[base]}`;
                              }

                              function getLanguageExtension(lang) {
                                  if (!lang) return "txt";
                                                                                                                   return LANGUAGE_EXTENSIONS[lang] || lang;
                              }

                              // Accent colour of each language (used for the dot, the top border and the file icon)
                              const LANGUAGE_COLORS = {
                                  python: "#ffd43b", javascript: "#f7df1e", typescript: "#3b9cff",
                                  html: "#ff7a45", xml: "#ff7a45", css: "#4fa8ff", scss: "#f06fb0",
                                  json: "#9ece6a", yaml: "#e0af68", sql: "#ff9e64",
                                  java: "#f0883e", kotlin: "#bb9af7", swift: "#ff7a45",
                                  c: "#7aa2f7", cpp: "#7aa2f7", csharp: "#bb9af7", php: "#9d8cff",
                                  go: "#2ac3de", rust: "#ff9e64", ruby: "#f7768e",
                                  bash: "#9ece6a", powershell: "#7aa2f7", dockerfile: "#4fa8ff",
                                  markdown: "#7dcfff", plaintext: "#a9b1d6",
                                  docx: "#4f8cff", xlsx: "#3fb950", pptx: "#ff7a45", pdf: "#f7768e"
                              };

                              function normalizeLangKey(lang) {
                                  const aliases = {
                                      py: "python", js: "javascript", ts: "typescript", yml: "yaml",
                                      sh: "bash", shell: "bash", zsh: "bash", ps1: "powershell",
                                      "c++": "cpp", "c#": "csharp", cs: "csharp", golang: "go",
                                      rs: "rust", rb: "ruby", md: "markdown", text: "plaintext", txt: "plaintext"
                                  };
                                  const key = (lang || "").toLowerCase();
                                  return aliases[key] || key;
                              }

                              function getLanguageColor(lang) {
                                  return LANGUAGE_COLORS[normalizeLangKey(lang)] || "#bb9af7";
                              }

                              // Names used by highlight.js (it knows "xml" for HTML, and has no "docx"/"pdf" etc.)
                              const NON_CODE_LANGUAGES = ["plaintext", "docx", "xlsx", "pptx", "pdf"];
                              const HIGHLIGHT_MAX_CHARS = 150000; // above this the text is shown plain to keep the page fast

                              // Colourize a <code> element. Safe by design: any problem (unknown language, library not
                              // loaded, huge text, non-code files like docx/pdf/txt) leaves the plain text untouched.
                              // `isStillValid` lets callers cancel (e.g. the side panel was reopened with another file).
                              function highlightCodeElement(codeEl, text, lang, isStillValid) {
                                  if (!codeEl || !text || text.length > HIGHLIGHT_MAX_CHARS) return;
                                                                                                                   let key = normalizeLangKey(lang);
                                  if (!key || NON_CODE_LANGUAGES.includes(key)) return;
                                                                                                                   if (key === "html") key = "xml";

                                                                                                                   highlightLibReady.then(function () {
                                                                                                                       if (!window.hljs || !window.hljs.getLanguage(key)) return;
                                                                                                                       if (isStillValid && !isStillValid()) return;
                                                                                                                       try {
                                                                                                                           const result = window.hljs.highlight(text, { language: key, ignoreIllegals: true });
                                                                                                                           codeEl.innerHTML = result.value;
                                                                                                                           codeEl.classList.add("hljs");
                                                                                                                       } catch (error) {
                                                                                                                           // Leave the plain text as it is
                                                                                                                       }
                                                                                                                   });
                              }

                              // Minimum number of lines for a code block to be shown as a "file" card
                              // (with a download button and a side-panel preview) instead of being displayed directly
                              const FILE_CARD_LINE_THRESHOLD = 10;

                              const FILE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
                              const DOWNLOAD_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
                              const CLOSE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

                              function countLines(text) {
                                  if (!text) return 0;
                                                                                                                   // If the last line is just an extra newline, don't count it as a real line
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

                              // ---------- File preview panel, on the side of the page ----------
                              let filePreviewOverlay, filePreviewPanel, filePreviewNameEl, filePreviewMetaEl,
                              filePreviewCodeEl, filePreviewCopyBtn, filePreviewDownloadBtn, filePreviewCloseBtn;
                              let currentPreviewText = "";
                              let currentPreviewFilename = "";
                              let currentPreviewToken = 0;

                              function buildFilePreviewPanel() {
                                  if (filePreviewPanel) return;

                                                                                                                   filePreviewOverlay = document.createElement("div");
                                  filePreviewOverlay.className = "file-preview-overlay";
                                  filePreviewOverlay.id = "filePreviewOverlay";

                                  filePreviewPanel = document.createElement("aside");
                                  filePreviewPanel.className = "file-preview-panel";
                                  filePreviewPanel.id = "filePreviewPanel";
                                  filePreviewPanel.setAttribute("aria-label", "File preview");
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
                                  <button type="button" class="file-preview-btn" id="filePreviewCopyBtn" title="Copy" aria-label="Copy">${COPY_ICON_SVG}</button>
                                  <button type="button" class="file-preview-btn" id="filePreviewDownloadBtn" title="Download" aria-label="Download">${DOWNLOAD_ICON_SVG}</button>
                                  <button type="button" class="file-preview-btn file-preview-close" id="filePreviewCloseBtn" title="Close" aria-label="Close">${CLOSE_ICON_SVG}</button>
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
                                  filePreviewMetaEl.textContent = `${getLanguageLabel(lang)} · ${countLines(text)} lines`;
                                  filePreviewCodeEl.className = "";
                                  filePreviewCodeEl.textContent = text;
                                  filePreviewPanel.style.setProperty("--lang-accent", getLanguageColor(lang));
                                  const previewToken = ++currentPreviewToken;
                                  highlightCodeElement(filePreviewCodeEl, text, lang, function () {
                                      return previewToken === currentPreviewToken;
                                  });

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

                              // Global counter for naming files generated on this page
                              let fileCardCounter = 0;

                              function buildFileCard(lang, codeText, filenameOverride) {
                                  let filename = filenameOverride;
                                  if (!filename) {
                                      filename = getDefaultFileName(lang);
                                  }
                                  const lineCount = countLines(codeText);

                                  const card = document.createElement("div");
                                  card.className = "code-file-card";
                                  card.setAttribute("role", "button");
                                  card.setAttribute("tabindex", "0");
                                  card.setAttribute("aria-label", `Show file ${filename}`);
                                  card.style.setProperty("--lang-accent", getLanguageColor(lang));
                                  card.innerHTML = `
                                  <span class="code-file-icon">${FILE_ICON_SVG}</span>
                                  <span class="code-file-info">
                                  <span class="code-file-name">${filename}</span>
                                  <span class="code-file-meta">${getLanguageLabel(lang)} · ${lineCount} lines · Click to preview</span>
                                  </span>
                                  <button type="button" class="code-file-download" title="Download file" aria-label="Download file">${DOWNLOAD_ICON_SVG}</button>
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

                              // Number of code lines that are visible in the block; beyond this the block scrolls inside itself
                              // (keep it in sync with --code-visible-lines in chat.css)
                              const CODE_VISIBLE_LINES = FILE_CARD_LINE_THRESHOLD;

                              const EXPAND_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;

                              async function copyTextToClipboard(text) {
                                  try {
                                      await navigator.clipboard.writeText(text);
                                  } catch (error) {
                                      // Fallback method for older browsers
                                      const temporaryTextarea = document.createElement("textarea");
                                      temporaryTextarea.value = text;
                                      temporaryTextarea.style.position = "fixed";
                                      temporaryTextarea.style.opacity = "0";
                                      document.body.appendChild(temporaryTextarea);
                                      temporaryTextarea.select();
                                      document.execCommand("copy");
                                      temporaryTextarea.remove();
                                  }
                              }

                              function makeCodeActionButton(className, title, innerHtml) {
                                  const btn = document.createElement("button");
                                  btn.type = "button";
                                  btn.className = "code-action-btn " + className;
                                  btn.title = title;
                                  btn.setAttribute("aria-label", title);
                                  btn.innerHTML = innerHtml;
                                  return btn;
                              }

                              function setupCodeCopyButtons(root) {
                                  const codeBlocks = (root || document).querySelectorAll(".message pre");
                                  codeBlocks.forEach(function (pre) {
                                      // Prevent processing again
                                      if (
                                          pre.dataset.codeProcessed === "true" ||
                                          (pre.parentElement && pre.parentElement.classList.contains("code-wrapper"))
                                      ) {
                                          return;
                                      }
                                      pre.dataset.codeProcessed = "true";

                                      const codeEl = pre.querySelector("code");
                                      const lang = getCodeLanguage(codeEl, pre);
                                      const codeText = codeEl ? codeEl.innerText : pre.innerText;
                                      const lineCount = countLines(codeText);
                                      const isLong = lineCount > CODE_VISIBLE_LINES;

                                      const filename = getDefaultFileName(lang, pre.closest(".message"));

                                      // Create the code wrapper and move the pre inside it
                                      const wrapper = document.createElement("div");
                                      wrapper.className = "code-wrapper";
                                      wrapper.style.setProperty("--lang-accent", getLanguageColor(lang));
                                      pre.parentNode.insertBefore(wrapper, pre);
                                      wrapper.appendChild(pre);

                                      // Header bar: language label on the left, actions on the right
                                      const header = document.createElement("div");
                                      header.className = "code-header";

                                      const langLabel = document.createElement("span");
                                      langLabel.className = "code-lang-label";
                                      langLabel.textContent = getLanguageLabel(lang);
                                      header.appendChild(langLabel);

                                      const actions = document.createElement("div");
                                      actions.className = "code-actions";

                                      // Copy
                                      const copyButton = makeCodeActionButton("copy-code-button", "Copy code", COPY_ICON_SVG);
                                      copyButton.addEventListener("click", async function () {
                                          if (!codeText) return;
                                          await copyTextToClipboard(codeText);
                                          copyButton.innerHTML = CHECK_ICON_SVG;
                                          copyButton.classList.add("copied");
                                          copyButton.title = "Copied";
                                          setTimeout(function () {
                                              copyButton.innerHTML = COPY_ICON_SVG;
                                              copyButton.classList.remove("copied");
                                              copyButton.title = "Copy code";
                                          }, 2000);
                                      });
                                      actions.appendChild(copyButton);

                                      // Show more (opens the full code in the side editor), only for long code
                                      if (isLong) {
                                          const moreButton = makeCodeActionButton(
                                              "show-more-code-button",
                                              "Show more",
                                              `${EXPAND_ICON_SVG}<span>Show more</span>`
                                          );
                                          moreButton.addEventListener("click", function () {
                                              openFilePreview(filename, lang, codeText);
                                          });
                                          actions.appendChild(moreButton);
                                      }

                                      // Download
                                      const downloadButton = makeCodeActionButton("download-code-button", "Download", DOWNLOAD_ICON_SVG);
                                      downloadButton.addEventListener("click", function () {
                                          downloadTextFile(filename, codeText);
                                      });
                                      actions.appendChild(downloadButton);

                                      header.appendChild(actions);
                                      wrapper.insertBefore(header, pre);

                                      // Colourize the code (the copied/downloaded text stays the original plain text)
                                      highlightCodeElement(codeEl, codeText, lang);
                                  });
                              }

                              // ---------- Attached files in saved messages + auto-linked file names ----------
                              // After a page refresh the server renders the stored message text, which contains the line
                              //   [Attached file: test.py]
                              // followed by the file's content in a code block. Here that pair is turned back into the same
                              // file card that is shown right after sending. The server's markdown filter may also turn names
                              // like test.py / test.txt into links (because ".py" is a real domain ending); those are unlinked.
                              const EXTENSION_TO_LANGUAGE = {
                                  txt: 'plaintext', log: 'plaintext', csv: 'plaintext',
                                  py: 'python', js: 'javascript', ts: 'typescript',
                                  html: 'html', htm: 'html', css: 'css', scss: 'scss',
                                  json: 'json', xml: 'xml', yml: 'yaml', yaml: 'yaml', md: 'markdown', ini: 'ini',
                                  sql: 'sql', sh: 'bash', bat: 'bash', ps1: 'powershell',
                                  java: 'java', kt: 'kotlin', swift: 'swift', c: 'c', h: 'c', cpp: 'cpp', cs: 'csharp',
                                  php: 'php', go: 'go', rs: 'rust', rb: 'ruby',
                                  docx: 'docx', xlsx: 'xlsx', pptx: 'pptx', pdf: 'pdf'
                              };

                              const ATTACHED_MARKER_RE = /^\[Attached file:\s*([\s\S]+?)\s*\]$/;
                              const FILE_NAME_EXTENSIONS = [
                                  "txt", "py", "js", "css", "html", "htm", "docx", "xlsx", "pptx", "pdf", "json", "xml", "yml",
                                  "yaml", "md", "csv", "log", "ini", "sql", "java", "php", "go", "rb", "rs", "ts", "sh", "bat",
                                  "c", "cpp", "h", "cs", "doc", "xls", "ppt"
                              ];

                              function unlinkFileNameLinks(root) {
                                  root.querySelectorAll("a[href]").forEach(function (a) {
                                      const label = (a.textContent || "").trim();
                                      const ext = getFileExtension(label);
                                      if (!ext || !FILE_NAME_EXTENSIONS.includes(ext)) return;
                                      if (/[\/:@\s]/.test(label) || /^www\./i.test(label)) return;

                                      // Only auto-generated links (the address is just the file name, maybe with http://)
                                      const href = (a.getAttribute("href") || "").trim().replace(/^[a-z]+:\/\//i, "").replace(/\/$/, "");
                                      if (href.toLowerCase() !== label.toLowerCase()) return;

                                      a.replaceWith(document.createTextNode(a.textContent));
                                  });
                              }

                              function convertAttachedFileMarkers(root) {
                                  root.querySelectorAll(".message-text").forEach(function (textEl) {
                                      Array.from(textEl.children).forEach(function (el) {
                                          if (el.tagName !== "P") return;
                                          const match = ATTACHED_MARKER_RE.exec((el.textContent || "").trim());
                                          if (!match) return;

                                          const filename = match[1];
                                          const next = el.nextElementSibling;

                                          if (next && next.tagName === "PRE") {
                                              const codeEl = next.querySelector("code");
                                              const lang = getCodeLanguage(codeEl, next);
                                              const content = codeEl ? codeEl.textContent : next.textContent;
                                              const card = buildFileCard(EXTENSION_TO_LANGUAGE[getFileExtension(filename)] || lang, content, filename);
                                              next.remove();
                                              el.replaceWith(card);
                                          } else {
                                              // No code block after it: just show the name as plain text (no link)
                                              el.textContent = `[Attached file: ${filename}]`;
                                          }
                                      });
                                  });
                              }

                              function fixMessageContent(root) {
                                  convertAttachedFileMarkers(root);
                                  unlinkFileNameLinks(root);
                              }

                              fixMessageContent(messages);
                              setupCodeCopyButtons();

                              // ---------- Sidebar (open/close on mobile, chat selection, new chat) ----------
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
                                                                                                                   // Whether web search is enabled; until the user clicks again,
                                                                                                                   // it stays on (meaning it remains active for several consecutive messages, not just once)
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

                                                                                                                   // Click on the web search indicator to turn it off
                                                                                                                   if (webSearchBadge) {
                                                                                                                       webSearchBadge.addEventListener('click', function () {
                                                                                                                           webSearchEnabled = false;
                                                                                                                           if (webImageSearch) webImageSearch.classList.remove('is-active');
                                                                                                                           webSearchBadge.classList.remove('is-visible');
                                                                                                                       });
                                                                                                                   }

                                                                                                                   // Enable/disable code mode
                                                                                                                   if (codeModeToggle) {
                                                                                                                       codeModeToggle.addEventListener('click', function () {
                                                                                                                           codeModeEnabled = !codeModeEnabled;
                                                                                                                           codeModeToggle.classList.toggle('is-active', codeModeEnabled);
                                                                                                                           if (codeModelBadge) codeModelBadge.style.display = codeModeEnabled ? 'flex' : 'none';
                                                                                                                           setAttachMenu(false);
                                                                                                                           input.focus();
                                                                                                                       });
                                                                                                                   }

                                                                                                                   // Click on the code mode indicator to turn it off
                                                                                                                   if (codeModelBadge) {
                                                                                                                       codeModelBadge.addEventListener('click', function () {
                                                                                                                           codeModeEnabled = false;
                                                                                                                           if (codeModeToggle) codeModeToggle.classList.remove('is-active');
                                                                                                                           codeModelBadge.style.display = 'none';
                                                                                                                       });
                                                                                                                   }

                                                                                                                   // ---------- File upload (txt, py, css, js, html), client-side normalization and sending to the server ----------
                                                                                                                   // Since the server side uses Ollama, the model only sees text (not binary files);
                                                                                                                   // so we read the file right here with JavaScript (for Office files, we convert the
                                                                                                                   // content to raw text), clean and standardize it, append it as text (inside a code
                                                                                                                   // block) to the user's message, and also display it as a file card.
                                                                                                                   const fileUploadTrigger = document.getElementById('fileUploadTrigger');
                                                                                                                   const fileUploadInput = document.getElementById('fileUploadInput');
                                                                                                                   const attachedFilesRow = document.getElementById('attachedFilesRow');

                                                                                                                   // Plain text formats: read directly with file.text()
                                                                                                                   const PLAIN_TEXT_EXTENSIONS = ['txt', 'py', 'css', 'js', 'html'];
                                                                                                                   // Modern Office formats (Open XML) + PDF: converted to text with client-side libraries
                                                                                                                   const OFFICE_EXTENSIONS = ['docx', 'xlsx', 'pptx', 'pdf'];
                                                                                                                   // Legacy and binary Office formats: there is no reliable browser-side library for these
                                                                                                                   const LEGACY_OFFICE_EXTENSIONS = ['doc', 'xls', 'ppt'];

                                                                                                                   const ALLOWED_UPLOAD_EXTENSIONS = PLAIN_TEXT_EXTENSIONS.concat(OFFICE_EXTENSIONS);

                                                                                                                   // As requested, no limit is applied to the file size or the length of the extracted text.
                                                                                                                   // Note: this means very large files may slow down the browser, and a very large prompt
                                                                                                                   // may exceed the context capacity of the Ollama model (in which case Ollama itself
                                                                                                                   // will either return an error or ignore the beginning of the prompt; it can't be controlled here).

                                                                                                                   let attachedFiles = []; // { name, content, lang }

                                                                                                                   function getFileExtension(filename) {
                                                                                                                       const match = /\.([a-zA-Z0-9]+)$/.exec(filename || "");
                                                                                                                       return match ? match[1].toLowerCase() : "";
                                                                                                                   }

                                                                                                                   // Normalize file text: remove BOM, unify newlines and trim extra trailing whitespace
                                                                                                                   function normalizeFileText(rawText) {
                                                                                                                       let text = rawText;
                                                                                                                       if (text.charCodeAt(0) === 0xFEFF) {
                                                                                                                           text = text.slice(1);
                                                                                                                       }
                                                                                                                       text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
                                                                                                                       // Collapse more than two consecutive blank lines (usually a byproduct of converting Office/PDF files)
                                                                                                                       text = text.replace(/\n{3,}/g, "\n\n");
                                                                                                                       text = text.replace(/\s+$/, "") + "\n";
                                                                                                                       return text;
                                                                                                                   }

                                                                                                                   function decodeXmlEntities(str) {
                                                                                                                       return str
                                                                                                                       .replace(/&lt;/g, "<")
                                                                                                                       .replace(/&gt;/g, ">")
                                                                                                                       .replace(/&quot;/g, '"')
                                                                                                                       .replace(/&apos;/g, "'")
                                                                                                                       .replace(/&amp;/g, "&");
                                                                                                                   }

                                                                                                                   // ---------- Lazy loading of Office file conversion libraries (only when needed) ----------
                                                                                                                   const OFFICE_LIB_URLS = {
                                                                                                                       mammoth: "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.12.2/mammoth.browser.min.js", // docx
                                                                                                                       jszip: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.2/jszip.min.js",                // pptx
                                                                                                                       xlsx: "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",               // xlsx
                                                                                                                       pdf: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",                  // pdf
                                                                                                                       pdfWorker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"      // pdf (web worker)
                                                                                                                   };

                                                                                                                   function loadScriptOnce(src) {
                                                                                                                       return new Promise(function (resolve, reject) {
                                                                                                                           const existing = document.querySelector(`script[src="${src}"]`);
                                                                                                                           if (existing) {
                                                                                                                               if (existing.dataset.loaded === "true") {
                                                                                                                                   resolve();
                                                                                                                               } else {
                                                                                                                                   existing.addEventListener("load", function () { resolve(); });
                                                                                                                                   existing.addEventListener("error", function () { reject(new Error("Error loading " + src)); });
                                                                                                                               }
                                                                                                                               return;
                                                                                                                           }
                                                                                                                           const script = document.createElement("script");
                                                                                                                           script.src = src;
                                                                                                                           script.async = true;
                                                                                                                           script.onload = function () {
                                                                                                                               script.dataset.loaded = "true";
                                                                                                                               resolve();
                                                                                                                           };
                                                                                                                           script.onerror = function () { reject(new Error("Error loading " + src)); };
                                                                                                                           document.head.appendChild(script);
                                                                                                                       });
                                                                                                                   }

                                                                                                                   let officeLibsPromise = null;
                                                                                                                   function ensureOfficeLibsLoaded() {
                                                                                                                       if (!officeLibsPromise) {
                                                                                                                           officeLibsPromise = Promise.all([
                                                                                                                               loadScriptOnce(OFFICE_LIB_URLS.mammoth),
                                                                                                                                                           loadScriptOnce(OFFICE_LIB_URLS.jszip),
                                                                                                                                                           loadScriptOnce(OFFICE_LIB_URLS.xlsx),
                                                                                                                                                           loadScriptOnce(OFFICE_LIB_URLS.pdf)
                                                                                                                           ]).then(function () {
                                                                                                                               if (window.pdfjsLib) {
                                                                                                                                   window.pdfjsLib.GlobalWorkerOptions.workerSrc = OFFICE_LIB_URLS.pdfWorker;
                                                                                                                               }
                                                                                                                           });
                                                                                                                       }
                                                                                                                       return officeLibsPromise;
                                                                                                                   }

                                                                                                                   // ---------- Extract text from each Office format ----------
                                                                                                                   async function extractDocxText(arrayBuffer) {
                                                                                                                       const result = await window.mammoth.extractRawText({ arrayBuffer });
                                                                                                                       return result.value;
                                                                                                                   }

                                                                                                                   async function extractXlsxText(arrayBuffer) {
                                                                                                                       const workbook = window.XLSX.read(arrayBuffer, { type: "array" });
                                                                                                                       const parts = workbook.SheetNames.map(function (sheetName) {
                                                                                                                           const sheet = workbook.Sheets[sheetName];
                                                                                                                           const csv = window.XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
                                                                                                                           return `--- Sheet: ${sheetName} ---\n${csv}`;
                                                                                                                       });
                                                                                                                       return parts.join("\n\n");
                                                                                                                   }

                                                                                                                   async function extractPptxText(arrayBuffer) {
                                                                                                                       const zip = await window.JSZip.loadAsync(arrayBuffer);
                                                                                                                       const slideFiles = Object.keys(zip.files)
                                                                                                                       .filter(function (name) { return /^ppt\/slides\/slide\d+\.xml$/.test(name); })
                                                                                                                       .sort(function (a, b) {
                                                                                                                           const numA = parseInt(a.match(/slide(\d+)\.xml/)[1], 10);
                                                                                                                           const numB = parseInt(b.match(/slide(\d+)\.xml/)[1], 10);
                                                                                                                           return numA - numB;
                                                                                                                       });

                                                                                                                       const slideTexts = [];
                                                                                                                       for (const name of slideFiles) {
                                                                                                                           const xml = await zip.files[name].async("string");
                                                                                                                           const runs = xml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
                                                                                                                           const text = runs
                                                                                                                           .map(function (run) { return decodeXmlEntities(run.replace(/<\/?a:t>/g, "")); })
                                                                                                                           .join(" ")
                                                                                                                           .trim();
                                                                                                                           slideTexts.push(text);
                                                                                                                       }

                                                                                                                       return slideTexts
                                                                                                                       .map(function (text, i) { return `--- Slide ${i + 1} ---\n${text}`; })
                                                                                                                       .join("\n\n");
                                                                                                                   }

                                                                                                                   async function extractPdfText(arrayBuffer) {
                                                                                                                       const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                                                                                                                       const pageTexts = [];

                                                                                                                       for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                                                                                                                           const page = await pdf.getPage(pageNum);
                                                                                                                           const content = await page.getTextContent();
                                                                                                                           const text = content.items.map(function (item) { return item.str; }).join(" ");
                                                                                                                           pageTexts.push(`--- Page ${pageNum} ---\n${text}`);
                                                                                                                       }

                                                                                                                       return pageTexts.join("\n\n");
                                                                                                                   }

                                                                                                                   async function extractRawTextFromFile(file, ext) {
                                                                                                                       if (PLAIN_TEXT_EXTENSIONS.includes(ext)) {
                                                                                                                           return file.text();
                                                                                                                       }

                                                                                                                       await ensureOfficeLibsLoaded();
                                                                                                                       const buffer = await file.arrayBuffer();

                                                                                                                       if (ext === "docx") return extractDocxText(buffer);
                                                                                                                   if (ext === "xlsx") return extractXlsxText(buffer);
                                                                                                                   if (ext === "pptx") return extractPptxText(buffer);
                                                                                                                   if (ext === "pdf") return extractPdfText(buffer);

                                                                                                                   throw new Error("Unsupported format: " + ext);
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
                                                                                                                           <button type="button" class="attached-file-chip-remove" aria-label="Remove file">${CLOSE_ICON_SVG}</button>
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

                                                                                                                               if (LEGACY_OFFICE_EXTENSIONS.includes(ext)) {
                                                                                                                                   alert(
                                                                                                                                       `The legacy ".${ext}" format is not supported because it can't be read with browser JavaScript.\n` +
                                                                                                                                       `Please open the file in Word/Excel/PowerPoint and use "Save As" to save it in the new format (.${ext}x).`
                                                                                                                                   );
                                                                                                                                   continue;
                                                                                                                               }

                                                                                                                               if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext)) {
                                                                                                                                   alert(`The ".${ext}" format is not supported. Only txt, py, css, js, html, docx, xlsx, pptx, pdf are allowed.`);
                                                                                                                                   continue;
                                                                                                                               }

                                                                                                                               try {
                                                                                                                                   const rawText = await extractRawTextFromFile(file, ext);
                                                                                                                                   const normalized = normalizeFileText(rawText);
                                                                                                                                   attachedFiles.push({
                                                                                                                                       name: file.name,
                                                                                                                                       content: normalized,
                                                                                                                                       lang: EXTENSION_TO_LANGUAGE[ext] || "plaintext"
                                                                                                                                   });
                                                                                                                               } catch (err) {
                                                                                                                                   console.error("Error reading file:", file.name, err);
                                                                                                                                   alert(`Error reading the file "${file.name}". Make sure the file is intact and not corrupted.`);
                                                                                                                               }
                                                                                                                           }

                                                                                                                           // Clear the input so that selecting the same file again is also possible
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
                                                                                                                               pinButton.title = row.classList.contains('pinned') ? 'Unpin' : 'Pin';
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


                                                                                                                   // Send message with the Enter key (Shift+Enter for a new line)
                                                                                                                   chatInput.addEventListener("keydown", function (event) {
                                                                                                                       if (event.key !== "Enter") {
                                                                                                                           return;
                                                                                                                       }
                                                                                                                       if (event.shiftKey) {
                                                                                                                           // Keep the default textarea behavior
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

                                                                                                                   // Same format as the server's {{ message.created|date:"Y/m/d H:i" }}
                                                                                                                   function formatMessageTime(d) {
                                                                                                                       const p = function (n) { return String(n).padStart(2, '0'); };
                                                                                                                       return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
                                                                                                                   }

                                                                                                                   function addMessage(text, role, files) {
                                                                                                                       const div = document.createElement('div');
                                                                                                                       div.className = `message ${role}-message`;
                                                                                                                       // Same markup as the server-rendered messages in chat.html (including dir="auto"),
                                                                                                                       // so a live message and a message loaded after a refresh look exactly the same.
                                                                                                                       div.innerHTML = `
                                                                                                                       <div class="message-text" dir="auto"></div>
                                                                                                                       <span class="message-time">${formatMessageTime(new Date())}</span>
                                                                                                                       `;
                                                                                                                       // The user's message is always plain text (no HTML injection risk since it comes
                                                                                                                       // directly from the input and we don't set innerHTML); the assistant's message may
                                                                                                                       // contain Markdown, which is rendered separately where it's used (the stream loop).
                                                                                                                       const textEl = div.querySelector('.message-text');
                                                                                                                       textEl.textContent = text;

                                                                                                                       // If the user also attached files, show a file card for each one
                                                                                                                       // (the same component used for long code blocks)
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

                                                                                                                   // If this chat is already in the list, don't add anything
                                                                                                                   if (chatHistory.querySelector(`[data-chat-id="${chatId}"]`)) return;

                                                                                                                   const placeholder = '00000000-0000-0000-0000-000000000000';
                                                                                                                   const pageUrl = (chatHistory.dataset.chatPageTemplate || '').replace(placeholder, chatId);
                                                                                                                   const pinUrl = (chatHistory.dataset.pinTemplate || '').replace(placeholder, chatId);
                                                                                                                   const deleteUrl = (chatHistory.dataset.deleteTemplate || '').replace(placeholder, chatId);

                                                                                                                   // Chat name exactly like the server: the first 20 characters of the message
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

                                                                                                                   // The new chat should be added at the top of the list (after the "Recent chats" title)
                                                                                                                   const label = chatHistory.querySelector('.chat-history-label');
                                                                                                                   if (label && label.nextSibling) {
                                                                                                                       chatHistory.insertBefore(row, label.nextSibling);
                                                                                                                   } else {
                                                                                                                       chatHistory.appendChild(row);
                                                                                                                   }

                                                                                                                   // Activate the pin/delete buttons on this new row (same logic as the existing rows)
                                                                                                                   const pinButton = row.querySelector('.pin-action');
                                                                                                                   const deleteButton = row.querySelector('.delete-action');

                                                                                                                   if (pinButton) {
                                                                                                                       pinButton.addEventListener('click', function (event) {
                                                                                                                           event.stopPropagation();
                                                                                                                           row.classList.toggle('pinned');
                                                                                                                           pinButton.title = row.classList.contains('pinned') ? 'Unpin' : 'Pin';
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

                                                                                                                   // ---------- Switching between chats without a page reload ----------
                                                                                                                   // Opening another chat used to load a whole new page, which cancelled the reply that was still
                                                                                                                   // being received. Now the chat is swapped inside the same page: the running reply keeps being
                                                                                                                   // received in the background, and when the user returns, the live message is shown again.
                                                                                                                   const NO_CHAT_ID_PLACEHOLDER = '00000000-0000-0000-0000-000000000000';
                                                                                                                   let viewPath = location.pathname;           // path of the chat that is currently on screen
                                                                                                                   const activeStreams = new Map();            // path -> reply that is still being received
                                                                                                                   const chatSnapshots = new Map();            // path -> message nodes of a chat we left while it was replying
                                                                                                                   let switchToken = 0;

                                                                                                                   function getChatIdByPath(path) {
                                                                                                                       const rows = document.querySelectorAll('#chatHistory .chat-history-row');
                                                                                                                       for (const row of rows) {
                                                                                                                           const link = row.querySelector('.chat-history-item a');
                                                                                                                           if (link && new URL(link.href, location.href).pathname === path) return row.dataset.chatId || null;
                                                                                                                       }
                                                                                                                       return null;
                                                                                                                   }

                                                                                                                   function refreshSendState() {
                                                                                                                       sendButton.disabled = activeStreams.has(viewPath);
                                                                                                                   }

                                                                                                                   function rekeyChatStream(stream, newPath) {
                                                                                                                       const oldPath = stream.path;
                                                                                                                       if (oldPath === newPath) return;
                                                                                                                   activeStreams.delete(oldPath);
                                                                                                                       stream.path = newPath;
                                                                                                                       activeStreams.set(newPath, stream);
                                                                                                                       if (chatSnapshots.has(oldPath)) {
                                                                                                                           const snap = chatSnapshots.get(oldPath);
                                                                                                                           chatSnapshots.delete(oldPath);
                                                                                                                           snap.formAction = stream.formAction;
                                                                                                                           chatSnapshots.set(newPath, snap);
                                                                                                                       }
                                                                                                                       if (viewPath === oldPath) viewPath = newPath;
                                                                                                                   }

                                                                                                                   function stashCurrentChat() {
                                                                                                                       // Only a chat that is still receiving a reply needs to be kept alive
                                                                                                                       const stream = activeStreams.get(viewPath);
                                                                                                                       if (!stream) return;
                                                                                                                   chatSnapshots.set(viewPath, {
                                                                                                                       nodes: Array.from(messages.childNodes),
                                                                                                                                     formAction: form.action,
                                                                                                                                         stream: stream
                                                                                                                   });
                                                                                                                   }

                                                                                                                   function setEmptyState(empty) {
                                                                                                                       if (empty) {
                                                                                                                           if (!chatApp.classList.contains('is-empty')) {
                                                                                                                               chatApp.classList.add('is-empty');
                                                                                                                               emptyHero.appendChild(form);
                                                                                                                           }
                                                                                                                       } else {
                                                                                                                           exitEmptyState();
                                                                                                                       }
                                                                                                                   }

                                                                                                                   function markActiveChat(path) {
                                                                                                                       document.querySelectorAll('.chat-history-item').forEach(function (i) { i.classList.remove('active'); });
                                                                                                                       document.querySelectorAll('#chatHistory .chat-history-row').forEach(function (row) {
                                                                                                                           const link = row.querySelector('.chat-history-item a');
                                                                                                                           if (link && new URL(link.href, location.href).pathname === path) {
                                                                                                                               row.querySelector('.chat-history-item').classList.add('active');
                                                                                                                           }
                                                                                                                       });
                                                                                                                   }

                                                                                                                   async function switchToChat(url, push) {
                                                                                                                       const target = new URL(url, location.href);
                                                                                                                       if (target.pathname === viewPath) {
                                                                                                                           closeSidebar();
                                                                                                                           return;
                                                                                                                       }
                                                                                                                       const token = ++switchToken;

                                                                                                                       // A reply of a brand-new chat that has no id yet must not be shown for the "new chat" page
                                                                                                                       let snap = chatSnapshots.get(target.pathname);
                                                                                                                       if (snap && !snap.stream.chatId) snap = null;

                                                                                                                   let doc = null;
                                                                                                                       if (!snap) {
                                                                                                                           try {
                                                                                                                               const res = await fetch(target.href, { credentials: 'same-origin' });
                                                                                                                               if (!res.ok) throw new Error('Bad response');
                                                                                                                   doc = new DOMParser().parseFromString(await res.text(), 'text/html');
                                                                                                                               if (!doc.getElementById('messages')) throw new Error('Not a chat page');
                                                                                                                           } catch (err) {
                                                                                                                               window.location.href = target.href; // fall back to a normal page load
                                                                                                                               return;
                                                                                                                           }
                                                                                                                           if (token !== switchToken) return; // the user already clicked another chat
                                                                                                                       }

                                                                                                                       stashCurrentChat();
                                                                                                                       messages.replaceChildren();

                                                                                                                       if (snap) {
                                                                                                                           snap.nodes.forEach(function (node) { messages.appendChild(node); });
                                                                                                                           chatSnapshots.delete(target.pathname);
                                                                                                                           form.action = snap.formAction;
                                                                                                                   setEmptyState(false);
                                                                                                                       } else {
                                                                                                                           const newMessages = doc.getElementById('messages');
                                                                                                                           Array.from(newMessages.childNodes).forEach(function (node) {
                                                                                                                               messages.appendChild(document.importNode(node, true));
                                                                                                                           });
                                                                                                                           const newForm = doc.getElementById('chatForm');
                                                                                                                           if (newForm) {
                                                                                                                               form.setAttribute('action', newForm.getAttribute('action'));
                                                                                                                   if (newForm.dataset.urlTemplate) form.dataset.urlTemplate = newForm.dataset.urlTemplate;
                                                                                                                   if (newForm.dataset.pageUrlTemplate) form.dataset.pageUrlTemplate = newForm.dataset.pageUrlTemplate;
                                                                                                                           }
                                                                                                                           const newApp = doc.getElementById('chatApp');
                                                                                                                   setEmptyState(!!(newApp && newApp.classList.contains('is-empty')));
                                                                                                                   fixMessageContent(messages);
                                                                                                                   setupCodeCopyButtons();
                                                                                                                   if (doc.title) document.title = doc.title;
                                                                                                                       }

                                                                                                                       viewPath = target.pathname;
                                                                                                                   if (push) history.pushState({}, '', target.href);
                                                                                                                   markActiveChat(viewPath);
                                                                                                                   refreshSendState();
                                                                                                                   autoScroll = true;
                                                                                                                   messages.scrollTop = messages.scrollHeight;
                                                                                                                   closeSidebar();
                                                                                                                   }

                                                                                                                   // Clicking a chat in the sidebar (also works for chats added later, thanks to delegation)
                                                                                                                   const chatHistoryEl = document.getElementById('chatHistory');
                                                                                                                   if (chatHistoryEl) {
                                                                                                                       chatHistoryEl.addEventListener('click', function (event) {
                                                                                                                           if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) return; // keep "open in new tab"
                                                                                                                           const item = event.target.closest('.chat-history-item');
                                                                                                                           if (!item) return;
                                                                                                                           const link = item.querySelector('a');
                                                                                                                           if (!link) return;
                                                                                                                           event.preventDefault();
                                                                                                                           switchToChat(link.href, true);
                                                                                                                       });
                                                                                                                   }

                                                                                                                   if (newChatButton) {
                                                                                                                       newChatButton.addEventListener('click', function (event) {
                                                                                                                           if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey) return;
                                                                                                                           event.preventDefault();
                                                                                                                           switchToChat(newChatButton.href, true);
                                                                                                                       });
                                                                                                                   }

                                                                                                                   window.addEventListener('popstate', function () {
                                                                                                                       switchToChat(location.href, false);
                                                                                                                   });

                                                                                                                   form.addEventListener('submit', async (e) => {
                                                                                                                       e.preventDefault();

                                                                                                                       const text = input.value.trim();
                                                                                                                       if (!text && attachedFiles.length === 0) return;
                                                                                                                                         if (activeStreams.has(viewPath)) return; // this chat is still answering

                                                                                                                                         // The text that is actually sent to the server (and from there to Ollama): the user's
                                                                                                                                         // message plus the normalized content of the attached files, inside a code block with the file name.
                                                                                                                                         // Since Ollama only sees text, not binary files, the content must be added to the prompt text right here.
                                                                                                                                         let composedText = text;
                                                                                                                       attachedFiles.forEach(function (file) {
                                                                                                                           composedText += `\n\n[Attached file: ${file.name}]\n\`\`\`${file.lang}\n${file.content}\`\`\``;
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
                                                                                                                       autoScroll = true; // a newly sent message always jumps to the bottom
                                                                                                                       addMessage(text || 'File sent', 'user', filesToShow);
                                                                                                                       input.value = '';
                                                                                                                       attachedFiles = [];
                                                                                                                       renderAttachedFilesRow();
                                                                                                                       sendButton.disabled = true;

                                                                                                                       const aiMessageEl = addMessage('', 'ai');
                                                                                                                       const aiTextEl = aiMessageEl.querySelector('.message-text');

                                                                                                                       // This reply keeps running even if the user opens another chat in the meantime
                                                                                                                       const stream = {
                                                                                                                           path: viewPath,
                                                                                                                           chatId: getChatIdByPath(viewPath),
                                                                                                                                         formAction: form.action
                                                                                                                       };
                                                                                                                       activeStreams.set(stream.path, stream);
                                                                                                                       if (stream.chatId) setChatRowLoading(stream.chatId, true);

                                                                                                                                         try {
                                                                                                                                             const res = await fetch(form.action, {
                                                                                                                                                 method: 'POST',
                                                                                                                                                 body: formData
                                                                                                                                             });

                                                                                                                                             if (!res.ok || !res.body) {
                                                                                                                                                 throw new Error('Stream error');
                                                                                                                                             }

                                                                                                                                             // If this was the first message of this chat, the server created a new chat and returned
                                                                                                                                             // its id in the header. We need to update the form action and the page URL with this id
                                                                                                                                             // so that subsequent messages are added to the same chat,
                                                                                                                                             // rather than every message creating a new chat.
                                                                                                                                             const newChatId = res.headers.get('X-Chat-Id');
                                                                                                                                             if (newChatId && form.dataset.urlTemplate) {
                                                                                                                                                 const newFormAction = form.dataset.urlTemplate.replace(NO_CHAT_ID_PLACEHOLDER, newChatId);
                                                                                                                                                 const newPageUrl = form.dataset.pageUrlTemplate
                                                                                                                                                 ? form.dataset.pageUrlTemplate.replace(NO_CHAT_ID_PLACEHOLDER, newChatId)
                                                                                                                                                 : null;
                                                                                                                                                 stream.formAction = newFormAction;
                                                                                                                                                 stream.chatId = newChatId;

                                                                                                                                                 // Only touch the address bar and the form if the user is still looking at this chat
                                                                                                                                                 if (stream.path === viewPath) {
                                                                                                                                                     form.action = newFormAction;
                                                                                                                                         if (newPageUrl) history.replaceState({}, '', newPageUrl);
                                                                                                                                                 }
                                                                                                                                                 if (newPageUrl) rekeyChatStream(stream, new URL(newPageUrl, location.href).pathname);

                                                                                                                                         // The chat is added to the sidebar without refreshing the page
                                                                                                                                         addChatToSidebar(newChatId, text);
                                                                                                                                                 setChatRowLoading(newChatId, true);
                                                                                                                                             }

                                                                                                                                             // Wait for the Markdown libraries to load (usually very fast, also loads from cache)
                                                                                                                                             await markdownLibsReady;

                                                                                                                                             const reader = res.body.getReader();
                                                                                                                                             const decoder = new TextDecoder('utf-8');
                                                                                                                                             let fullText = '';

                                                                                                                                             while (true) {
                                                                                                                                                 const { value, done } = await reader.read();
                                                                                                                                                 if (done) break;

                                                                                                                                         const chunk = decoder.decode(value, { stream: true });
                                                                                                                                                 fullText += chunk;
                                                                                                                                                 // We convert Markdown to HTML during streaming too, so the live display
                                                                                                                                                 // is exactly what is seen after the page refreshes (via the server's markdownify)
                                                                                                                                                 aiTextEl.innerHTML = renderMarkdown(fullText);
                                                                                                                                                 scrollToBottomIfFollowing();
                                                                                                                                             }

                                                                                                                                             // After the stream ends, clean up file names and enable the code buttons for the new code blocks
                                                                                                                                             fixMessageContent(aiMessageEl);
                                                                                                                                             setupCodeCopyButtons(aiMessageEl);
                                                                                                                                         } catch (err) {
                                                                                                                                             aiTextEl.textContent = 'Error receiving response';
                                                                                                                                         } finally {
                                                                                                                                             activeStreams.delete(stream.path);
                                                                                                                                             if (stream.chatId) setChatRowLoading(stream.chatId, false);
                                                                                                                                         if (stream.path === viewPath) {
                                                                                                                                             sendButton.disabled = false;
                                                                                                                                             input.focus();
                                                                                                                                         }
                                                                                                                                         }
                                                                                                                   });
            } // End of the if (chatApp) { ... } guard
            (function () {
                // The "replying" animation is shown in the sidebar, next to the pin button of the chat that is
                // answering. Several chats can answer at the same time, each with its own spinner.
                const TOTAL_FRAMES = 6;
                const FRAME_INTERVAL_MS = 50;

                const loadingBox = document.getElementById("aiLoading");
                const loadingPath = loadingBox ? loadingBox.dataset.loadingPath : "";
                if (!loadingPath) return;

                const framePaths = Array.from(
                    { length: TOTAL_FRAMES },
                    (_, i) => `${loadingPath}loading${i + 1}.svg`
                );

                let timerId = null;
                let currentIndex = 0;

                function tick() {
                    const spinners = document.querySelectorAll(".chat-row-loading");
                    if (spinners.length === 0) {
                        clearInterval(timerId);
                        timerId = null;
                        currentIndex = 0;
                        return;
                    }
                    currentIndex = (currentIndex + 1) % TOTAL_FRAMES;
                    spinners.forEach(function (img) { img.src = framePaths[currentIndex]; });
                }

                window.setChatRowLoading = function (chatId, on) {
                    const row = document.querySelector(`#chatHistory .chat-history-row[data-chat-id="${chatId}"]`);
                    if (!row) return;
                    let img = row.querySelector(".chat-row-loading");

                    if (on) {
                        row.classList.add("is-generating");
                        if (!img) {
                            img = document.createElement("img");
                            img.className = "chat-row-loading";
                            img.alt = "";
                            img.setAttribute("aria-label", "Responding");
                            img.src = framePaths[0];
                            row.appendChild(img);
                        }
                        if (!timerId) timerId = setInterval(tick, FRAME_INTERVAL_MS);
                    } else {
                        row.classList.remove("is-generating");
                        if (img) img.remove();
                    }
                };
            })();
            (function () {
                try {
                    var saved = localStorage.getItem('theme');
                    var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                    document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                    // If localStorage is unavailable (e.g. private browsing mode), default to light
                }
            })();
