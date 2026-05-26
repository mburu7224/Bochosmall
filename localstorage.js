// localstorage.js
// Centralized localStorage helpers for device-scoped saved videos
// Exposes: getSavedVideos(), saveVideoToDevice(videoObj), removeVideoFromDevice(videoUrl)

(function () {
    'use strict';

    function getSavedVideos() {
        try {
            return JSON.parse(localStorage.getItem('savedVideos')) || [];
        } catch (e) {
            return [];
        }
    }

    function setSavedVideos(arr) {
        try {
            localStorage.setItem('savedVideos', JSON.stringify(arr || []));
            return true;
        } catch (e) {
            return false;
        }
    }

    function saveVideoToDevice(videoObj) {
        if (!videoObj || !videoObj.url) return false;
        try {
            const list = getSavedVideos();
            // avoid duplicates by URL
            if (list.some(i => i && i.url === videoObj.url)) return false;
            list.unshift(videoObj);
            return setSavedVideos(list);
        } catch (e) {
            return false;
        }
    }

    function removeVideoFromDevice(videoUrl) {
        if (!videoUrl) return false;
        try {
            const list = getSavedVideos();
            const filtered = list.filter(i => i && i.url !== videoUrl);
            return setSavedVideos(filtered);
        } catch (e) {
            return false;
        }
    }

    // Export to global scope so existing code can call them directly
    window.getSavedVideos = getSavedVideos;
    window.saveVideoToDevice = saveVideoToDevice;
    window.removeVideoFromDevice = removeVideoFromDevice;

    /**
     * Bind delegated handler for "Watch Now" buttons rendered inside the saved videos grid.
     * This ensures clicks from the Saved Videos view fully mirror the native Home behavior
     * by forcing the UI to the theater/player layout and calling the app's native loader.
     */
    function bindSavedWatchNowDelegation() {
        document.addEventListener('click', (e) => {
            try {
                const btn = e.target.closest && e.target.closest('.watch-now-btn');
                if (!btn) return;

                // Prevent duplicate handling if other handlers exist
                e.preventDefault();
                e.stopPropagation();

                // Find the saved card container and compute its index among siblings
                const card = btn.closest && btn.closest('.saved-card');
                if (!card) {
                    console.warn('Saved card wrapper not found for Watch Now button');
                    return;
                }

                const grid = card.parentElement;
                const children = Array.prototype.slice.call(grid.children || []);
                const idx = children.indexOf(card);

                const saved = getSavedVideos() || [];
                const entry = (idx >= 0 && idx < saved.length) ? saved[idx] : null;
                if (!entry) {
                    // Fallback: try matching by thumbnail or title
                    const img = card.querySelector('img');
                    const titleEl = card.querySelector('.saved-title');
                    const imgSrc = img ? img.src : '';
                    const titleText = titleEl ? titleEl.textContent.trim() : '';
                    const found = saved.find(s => (s.thumbnailUrl && s.thumbnailUrl === imgSrc) || (s.title && s.title === titleText));
                    if (found) entry = found;
                }

                if (!entry) {
                    console.warn('Saved video entry not found for Watch Now action');
                    return;
                }

                // Force UI switch to the theater/player layout (mirror Home behavior)
                try { if (typeof pauseAllMedia === 'function') pauseAllMedia(); } catch (e) { /* ignore */ }

                // Hide saved videos section and other content sections, show theater
                try {
                    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                    const savedSection = document.getElementById('saved-videos-section');
                    if (savedSection) savedSection.classList.remove('active');
                    const theater = document.getElementById('theaterContainer');
                    if (theater) {
                        theater.classList.remove('hidden');
                        theater.style.display = 'flex';
                    }
                    // Ensure nav active state cleared so player view is prominent
                    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                    // Reset scroll so player is visible (YouTube-style behavior)
                    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { window.scrollTo(0, 0); }
                } catch (err) {
                    console.warn('Failed to switch UI to player view', err);
                }

                // Build canonical docItem and playlist shape and call native loader
                const docData = Object.assign({}, (entry.metadata || {}));
                docData.url = entry.url || docData.url;
                if (entry.thumbnailUrl) docData.thumbnailUrl = entry.thumbnailUrl;
                if (entry.title) docData.title = entry.title;
                const docItem = { id: entry.id || entry.url || `saved_${entry.savedAt || Date.now()}`, data: docData };

                const allDocs = (saved || []).map((e) => ({ id: e.id || e.url || String(e.savedAt || ''), data: Object.assign({}, (e.metadata || {}), { url: e.url, thumbnailUrl: e.thumbnailUrl, title: e.title }) }));

                if (typeof openTheaterWithVideo === 'function') {
                    openTheaterWithVideo(docItem, allDocs);
                    return;
                }

                if (typeof playWatchVideo === 'function') {
                    playWatchVideo(docItem);
                    return;
                }

                // As a last resort, attempt to populate the main player directly
                try {
                    const playerContainer = (typeof getPlayerContainer === 'function') ? getPlayerContainer() : document.getElementById('mainPlayerView');
                    if (playerContainer && typeof populateMainPlayer === 'function') {
                        populateMainPlayer(docItem);
                    }
                } catch (err) {
                    console.warn('Fallback player population failed', err);
                }

            } catch (outerErr) {
                console.error('Error handling saved Watch Now click', outerErr);
            }
        });
    }

    // Bind immediately in case saved view is already rendered; safe to call multiple times
    try { bindSavedWatchNowDelegation(); } catch (e) { /* ignore */ }
})();
