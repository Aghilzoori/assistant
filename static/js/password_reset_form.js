(function () {
    'use strict';

    // Add placeholder to email field
    const emailField = document.querySelector('input[name="email"]');
    if (emailField) {
        emailField.placeholder = 'you@example.com';
    }

    // Auto-hide messages after 5 seconds
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

    const successMsg = document.querySelector('.success-message');
    if (successMsg) {
        setTimeout(function () {
            successMsg.style.transition = 'opacity 0.5s ease';
            successMsg.style.opacity = '0';
            setTimeout(function () {
                successMsg.remove();
            }, 500);
        }, 5000);
    }

    console.log('🔐 Password reset page loaded!');
})();