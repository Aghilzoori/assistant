(function () {
    const switcher = document.getElementById('settingsThemeSwitcher');
    const options = switcher ? switcher.querySelectorAll('.settings-theme-option') : [];

    function currentTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function syncActiveOption() {
        const active = currentTheme();
        options.forEach(function (btn) {
            const isActive = btn.dataset.themeValue === active;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-checked', String(isActive));
        });
    }

    function setTheme(value) {
        document.documentElement.setAttribute('data-theme', value);
        try {
            localStorage.setItem('theme', value);
        } catch (e) {
            // localStorage not available, applies only for this session
        }
        syncActiveOption();
    }

    options.forEach(function (btn) {
        btn.addEventListener('click', function () {
            setTheme(btn.dataset.themeValue);
        });
    });

    syncActiveOption();

    // ---------- Password Form Validation ----------
    const passwordForm = document.getElementById('passwordForm');
    const newPassword = document.getElementById('newPassword');
    const newPasswordConfirm = document.getElementById('newPasswordConfirm');
    const mismatchError = document.getElementById('passwordMismatchError');

    if (passwordForm && newPassword && newPasswordConfirm && mismatchError) {
        passwordForm.addEventListener('submit', function (event) {
            if (newPassword.value !== newPasswordConfirm.value) {
                event.preventDefault();
                mismatchError.hidden = false;
                newPasswordConfirm.focus();
            } else {
                mismatchError.hidden = true;
            }
        });

        // Hide error message on typing to avoid confusion
        [newPassword, newPasswordConfirm].forEach(function (field) {
            field.addEventListener('input', function () {
                mismatchError.hidden = true;
            });
        });
    }
})();