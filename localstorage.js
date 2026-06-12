(function () {
    const SAVED_KEY = 'savedVideos';
    const HISTORY_KEY = 'watchHistory';
    const HISTORY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

    function readList(key) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function writeList(key, list) {
        localStorage.setItem(key, JSON.stringify(Array.isArray(list) ? list : []));
    }

    function getVideoIdentity(entry) {
        return entry && (entry.url || entry.firebaseUrl || entry.id || (entry.metadata && entry.metadata.url) || '');
    }

    function normalizeSavedVideo(entry) {
        const metadata = entry && entry.metadata ? entry.metadata : {};
        const url = getVideoIdentity(entry);

        return {
            id: (entry && entry.id) || url || String(Date.now()),
            title: (entry && entry.title) || metadata.title || 'Untitled',
            url,
            thumbnailUrl: (entry && entry.thumbnailUrl) || metadata.thumbnailUrl || '',
            metadata,
            savedAt: (entry && entry.savedAt) || Date.now()
        };
    }

    function getSavedVideos() {
        return readList(SAVED_KEY);
    }

    function saveVideoToDevice(entry) {
        const normalized = normalizeSavedVideo(entry || {});
        if (!normalized.url) return getSavedVideos();

        const list = getSavedVideos().filter((item) => getVideoIdentity(item) !== normalized.url);
        list.unshift(normalized);
        writeList(SAVED_KEY, list);
        return list;
    }

    function removeVideoFromDevice(identity) {
        const next = getSavedVideos().filter((item) => getVideoIdentity(item) !== identity && item.id !== identity);
        writeList(SAVED_KEY, next);
        return next;
    }

    function pruneHistory(list) {
        const cutoff = Date.now() - HISTORY_MAX_AGE_MS;
        return list.filter((entry) => Number(entry.watchedAt || 0) >= cutoff);
    }

    function getWatchHistory() {
        const pruned = pruneHistory(readList(HISTORY_KEY));
        writeList(HISTORY_KEY, pruned);
        return pruned;
    }

    function addToWatchHistory(entry) {
        const metadata = entry && entry.metadata ? entry.metadata : {};
        const identity = getVideoIdentity(entry);
        if (!identity) return getWatchHistory();

        const normalized = {
            id: (entry && entry.id) || identity,
            firebaseUrl: (entry && entry.firebaseUrl) || identity,
            title: (entry && entry.title) || metadata.title || 'Untitled',
            url: (entry && entry.url) || metadata.url || identity,
            thumbnailUrl: (entry && entry.thumbnailUrl) || metadata.thumbnailUrl || '',
            metadata,
            watchedAt: Date.now()
        };

        const list = getWatchHistory().filter((item) => getVideoIdentity(item) !== identity && item.id !== normalized.id);
        list.unshift(normalized);
        writeList(HISTORY_KEY, pruneHistory(list));
        return getWatchHistory();
    }

    function removeFromWatchHistory(identity) {
        const next = getWatchHistory().filter((item) => getVideoIdentity(item) !== identity && item.id !== identity);
        writeList(HISTORY_KEY, next);
        return next;
    }

    function setWatchHistory(list) {
        writeList(HISTORY_KEY, pruneHistory(Array.isArray(list) ? list : []));
        return true;
    }

    function removeOldWatchHistory() {
        getWatchHistory();
        return true;
    }

    function clearWatchHistory() {
        writeList(HISTORY_KEY, []);
    }

    window.getSavedVideos = getSavedVideos;
    window.saveVideoToDevice = saveVideoToDevice;
    window.removeVideoFromDevice = removeVideoFromDevice;
    window.getWatchHistory = getWatchHistory;
    window.setWatchHistory = setWatchHistory;
    window.addToWatchHistory = addToWatchHistory;
    window.removeFromWatchHistory = removeFromWatchHistory;
    window.removeOldWatchHistory = removeOldWatchHistory;
    window.clearWatchHistory = clearWatchHistory;
    removeOldWatchHistory();
})();
