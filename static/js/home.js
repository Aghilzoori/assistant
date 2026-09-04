(function () {
    'use strict';

    // ---------- Smooth scroll for "Learn More" ----------
    document.querySelector('.btn-secondary')?.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector('#features');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // ---------- Video hover play ----------
    document.querySelectorAll('.media-card video').forEach(function (video) {
        video.addEventListener('mouseenter', function () {
            this.play().catch(function () { });
        });
        video.addEventListener('mouseleave', function () {
            this.pause();
            this.currentTime = 0;
        });
    });

    // ---------- Toast function (for future use) ----------
    window.showToast = function (message) {
        const existing = document.querySelector('.home-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'home-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add('show');
        });

        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () {
                toast.remove();
            }, 400);
        }, 3000);
    };

    console.log('🚀 Home page loaded successfully!');
})();