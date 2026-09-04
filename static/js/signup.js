(function () {
    'use strict';

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

    // Add placeholder to Django form fields
    document.querySelectorAll('.register-form input').forEach(function (input) {
        if (!input.placeholder) {
            const label = document.querySelector('label[for="' + input.id + '"]');
            if (label) {
                const labelText = label.textContent.trim();
                input.placeholder = 'Enter ' + labelText.toLowerCase();
            }
        }
    });

    console.log('🚀 Register page loaded!');
})();