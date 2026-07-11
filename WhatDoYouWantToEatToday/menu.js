// 共用選單：解析 vendor.txt、localStorage 覆寫、下載
// python -m http.server 無法寫回磁碟，故編輯結果先存瀏覽器，再可下載覆蓋檔案

const MENU_STORAGE_KEY = 'dining-kuji-menu-v1';
const MENU_HEADER = [
    '# 用餐一番賞 — 料理選單（可直接編輯此檔，或用 edit.html 管理後下載覆蓋）',
    '# 格式：料理種類 || 店家名稱',
    '# 以 # 開頭的行會被忽略；空白行也會略過',
    '',
].join('\n');

function parseVendorText(text) {
    return String(text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
            const parts = line.split('||').map((part) => part.trim());
            const category = parts[0];
            const vendor = parts[1];
            if (!category || !vendor) {
                return null;
            }
            return { category, vendor };
        })
        .filter(Boolean);
}

function serializeMenuEntries(entries) {
    const body = entries
        .map((entry) => `${entry.category} || ${entry.vendor}`)
        .join('\n');
    return `${MENU_HEADER}${body}\n`;
}

function isSameEntry(a, b) {
    return Boolean(a && b && a.category === b.category && a.vendor === b.vendor);
}

function getStoredMenuText() {
    try {
        return localStorage.getItem(MENU_STORAGE_KEY);
    } catch (error) {
        console.warn('localStorage read failed', error);
        return null;
    }
}

function setStoredMenuText(text) {
    try {
        localStorage.setItem(MENU_STORAGE_KEY, text);
        return true;
    } catch (error) {
        console.error('localStorage write failed', error);
        return false;
    }
}

function clearStoredMenuText() {
    try {
        localStorage.removeItem(MENU_STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('localStorage clear failed', error);
        return false;
    }
}

function hasStoredMenu() {
    const text = getStoredMenuText();
    return Boolean(text && text.trim());
}

async function fetchVendorFileText() {
    const response = await fetch('vendor.txt', { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
}

/**
 * 優先使用 localStorage 覆寫；否則讀 vendor.txt。
 * @returns {Promise<{ entries: Array<{category:string, vendor:string}>, source: 'local'|'file', text: string }>}
 */
async function loadMenuEntriesFromSource() {
    const stored = getStoredMenuText();
    if (stored && stored.trim()) {
        const entries = parseVendorText(stored);
        if (entries.length > 0) {
            return { entries, source: 'local', text: stored };
        }
    }

    const text = await fetchVendorFileText();
    const entries = parseVendorText(text);
    if (entries.length === 0) {
        throw new Error('No valid entries');
    }
    return { entries, source: 'file', text };
}

function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

function saveEntriesToLocalStorage(entries) {
    const text = serializeMenuEntries(entries);
    if (!setStoredMenuText(text)) {
        return { ok: false, text };
    }
    return { ok: true, text };
}
