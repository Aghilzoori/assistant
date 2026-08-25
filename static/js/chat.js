document.addEventListener("DOMContentLoaded", function () {
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const aiLoading = document.getElementById("aiLoading");

    /*
     * تغییر خودکار ارتفاع textarea
     * حداکثر ارتفاع: ۳۰ درصد ارتفاع صفحه
     */
    function resizeTextarea() {
        const maxHeight = window.innerHeight * 0.30;

        chatInput.style.height = "auto";

        const newHeight = Math.min(
            chatInput.scrollHeight,
            maxHeight
        );

        chatInput.style.height = newHeight + "px";

        if (chatInput.scrollHeight > maxHeight) {
            chatInput.style.overflowY = "auto";
        } else {
            chatInput.style.overflowY = "hidden";
        }
    }

    chatInput.addEventListener("input", resizeTextarea);

    /*
     * Enter برای ارسال
     * Shift + Enter برای خط جدید
     */
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

        if (chatForm.requestSubmit) {
            chatForm.requestSubmit();
        } else {
            chatForm.submit();
        }
    });

    /*
     * هنگام ارسال فرم
     */
    chatForm.addEventListener("submit", function (event) {
        const text = chatInput.value.trim();

        if (!text) {
            event.preventDefault();
            return;
        }

        // جلوگیری از ارسال چندباره
        if (chatForm.dataset.submitting === "true") {
            event.preventDefault();
            return;
        }

        chatForm.dataset.submitting = "true";

        // نمایش انیمیشن هدر
        if (aiLoading) {
            aiLoading.classList.add("active");
        }

        /*
         * disabled نکنید، چون مقدار textarea ارسال نمی‌شود.
         * readonly مقدار آن را همراه فرم ارسال می‌کند.
         */
        chatInput.readOnly = true;

        sendButton.disabled = true;
        sendButton.textContent = "⏳";
    });

    /*
     * اضافه‌کردن دکمه کپی به همه کدهای Markdown
     */
    const codeBlocks = document.querySelectorAll(".message pre");

    codeBlocks.forEach(function (pre) {
        // جلوگیری از اضافه‌شدن دوباره دکمه
        if (
            pre.parentElement &&
            pre.parentElement.classList.contains("code-wrapper")
        ) {
            return;
        }

        // ساخت ظرف کد
        const wrapper = document.createElement("div");
        wrapper.className = "code-wrapper";

        // قرار دادن wrapper قبل از pre
        pre.parentNode.insertBefore(wrapper, pre);

        // انتقال pre داخل wrapper
        wrapper.appendChild(pre);

        // ساخت دکمه کپی
        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "copy-code-button";
        copyButton.textContent = "کپی";

        wrapper.appendChild(copyButton);

        copyButton.addEventListener("click", async function () {
            const code = pre.querySelector("code");

            if (!code) {
                return;
            }

            const codeText = code.innerText;

            try {
                await navigator.clipboard.writeText(codeText);

                copyButton.textContent = "کپی شد";
                copyButton.classList.add("copied");

                setTimeout(function () {
                    copyButton.textContent = "کپی";
                    copyButton.classList.remove("copied");
                }, 2000);

            } catch (error) {
                // روش جایگزین برای مرورگرهای قدیمی‌تر
                const temporaryTextarea =
                    document.createElement("textarea");

                temporaryTextarea.value = codeText;
                temporaryTextarea.style.position = "fixed";
                temporaryTextarea.style.opacity = "0";

                document.body.appendChild(temporaryTextarea);
                temporaryTextarea.select();

                document.execCommand("copy");

                temporaryTextarea.remove();

                copyButton.textContent = "کپی شد";
                copyButton.classList.add("copied");

                setTimeout(function () {
                    copyButton.textContent = "کپی";
                    copyButton.classList.remove("copied");
                }, 2000);
            }
        });
    });

    // تنظیم ارتفاع اولیه textarea
    resizeTextarea();

    // تنظیم دوباره هنگام تغییر اندازه صفحه
    window.addEventListener("resize", resizeTextarea);
});