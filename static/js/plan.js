(function () {
    var root = document.documentElement;
    var btn = document.getElementById('themeToggle');

    // Restore a previously saved choice (only if the app hasn't set one).
    try {
        var saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') {
            root.setAttribute('data-theme', saved);
        }
    } catch (e) { }

    if (!btn) return;

    function current() {
        var attr = root.getAttribute('data-theme');
        if (attr === 'dark' || attr === 'light') return attr;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    btn.addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) { }
    });
})();