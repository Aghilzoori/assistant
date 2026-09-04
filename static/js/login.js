(function () {
    'use strict';

    // Add placeholder attributes to Django form fields
    const usernameField = document.querySelector('input[name="username"]');
    const passwordField = document.querySelector('input[name="password"]');

    if (usernameField) {
        usernameField.placeholder = 'Enter your username';
    }

    if (passwordField) {
        passwordField.placeholder = '••••••••';
    }

    // Auto-hide error messages after 5 seconds
    const errorMsg = document.querySelector('.error-message');
    if (errorMsg) {
        setTimeout(function () {
            errorMsg.style.transition = 'opacity 0.5s ease';
            errorMsg.style.opacity = '0';
            setTimeout(function () {
                errorMsg.remove();
            }, 500);
        }, 5000);
    }

    console.log('🚀 Login page loaded!');
})();