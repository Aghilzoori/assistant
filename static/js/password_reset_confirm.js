(function () {
    'use strict';

    // Add placeholder attributes to Django form fields
    const password1Field = document.querySelector('input[name="new_password1"]');
    const password2Field = document.querySelector('input[name="new_password2"]');

    if (password1Field) {
        password1Field.placeholder = 'Enter new password';
    }

    if (password2Field) {
        password2Field.placeholder = 'Confirm new password';
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

    console.log('🔑 Password reset confirm page loaded!');
})();