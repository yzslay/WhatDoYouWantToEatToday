const editStatus = document.getElementById('edit-status');
const entryForm = document.getElementById('entry-form');
const editIndexInput = document.getElementById('edit-index');
const categoryInput = document.getElementById('category-input');
const vendorInput = document.getElementById('vendor-input');
const saveEntryBtn = document.getElementById('save-entry-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const persistBtn = document.getElementById('persist-btn');
const downloadBtn = document.getElementById('download-btn');
const reloadFileBtn = document.getElementById('reload-file-btn');
const entryCount = document.getElementById('entry-count');
const searchInput = document.getElementById('search-input');
const entryList = document.getElementById('entry-list');

/** @type {Array<{category:string, vendor:string}>} */
let entries = [];
let dirty = false;
let sourceLabel = 'file';

function setStatus(message, kind = 'info') {
    editStatus.textContent = message;
    editStatus.dataset.kind = kind;
}

function markDirty(isDirty = true) {
    dirty = isDirty;
    updateMeta();
}

function updateMeta() {
    const dirtyMark = dirty ? ' · 有未寫入瀏覽器的變更' : '';
    const sourceText = sourceLabel === 'local' ? '本機瀏覽器覆寫' : 'vendor.txt 檔案';
    entryCount.textContent = `共 ${entries.length} 筆 · 來源：${sourceText}${dirtyMark}`;
}

function exitEditMode() {
    editIndexInput.value = '';
    categoryInput.value = '';
    vendorInput.value = '';
    saveEntryBtn.textContent = '新增品項';
    cancelEditBtn.hidden = true;
}

function enterEditMode(index) {
    const entry = entries[index];
    if (!entry) {
        return;
    }
    editIndexInput.value = String(index);
    categoryInput.value = entry.category;
    vendorInput.value = entry.vendor;
    saveEntryBtn.textContent = '更新品項';
    cancelEditBtn.hidden = false;
    categoryInput.focus();
}

function matchesSearch(entry, query) {
    if (!query) {
        return true;
    }
    const q = query.toLowerCase();
    return entry.category.toLowerCase().includes(q) || entry.vendor.toLowerCase().includes(q);
}

function renderList() {
    const query = searchInput.value.trim();
    entryList.innerHTML = '';

    const fragment = document.createDocumentFragment();
    let visible = 0;

    entries.forEach((entry, index) => {
        if (!matchesSearch(entry, query)) {
            return;
        }
        visible += 1;

        const li = document.createElement('li');
        li.className = 'entry-item';

        const main = document.createElement('div');
        main.className = 'entry-main';

        const cat = document.createElement('span');
        cat.className = 'entry-category';
        cat.textContent = entry.category;

        const vendor = document.createElement('span');
        vendor.className = 'entry-vendor';
        vendor.textContent = entry.vendor;

        main.append(cat, vendor);

        const actions = document.createElement('div');
        actions.className = 'entry-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'mini-btn';
        editBtn.textContent = '編輯';
        editBtn.addEventListener('click', () => enterEditMode(index));

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'mini-btn danger';
        deleteBtn.textContent = '刪除';
        deleteBtn.addEventListener('click', () => {
            if (!confirm(`確定刪除「${entry.category} · ${entry.vendor}」？`)) {
                return;
            }
            entries.splice(index, 1);
            if (editIndexInput.value === String(index)) {
                exitEditMode();
            }
            markDirty(true);
            renderList();
            setStatus('已刪除（記得按「儲存到本機瀏覽器」）', 'warn');
        });

        actions.append(editBtn, deleteBtn);
        li.append(main, actions);
        fragment.append(li);
    });

    if (visible === 0) {
        const empty = document.createElement('li');
        empty.className = 'entry-empty';
        empty.textContent = entries.length === 0 ? '目前沒有品項，請在上方新增。' : '沒有符合搜尋的品項。';
        entryList.append(empty);
    } else {
        entryList.append(fragment);
    }

    updateMeta();
}

function upsertFromForm(event) {
    event.preventDefault();

    const category = categoryInput.value.trim();
    const vendor = vendorInput.value.trim();
    if (!category || !vendor) {
        setStatus('請填寫料理種類與店家名稱', 'error');
        return;
    }

    const next = { category, vendor };
    const editIndex = editIndexInput.value === '' ? -1 : Number(editIndexInput.value);

    const duplicateIndex = entries.findIndex(
        (entry, index) => index !== editIndex && isSameEntry(entry, next)
    );
    if (duplicateIndex >= 0) {
        setStatus('清單裡已有相同的料理與店家', 'error');
        return;
    }

    if (editIndex >= 0 && entries[editIndex]) {
        entries[editIndex] = next;
        setStatus('已更新品項（記得按「儲存到本機瀏覽器」）', 'ok');
    } else {
        entries.push(next);
        setStatus('已新增品項（記得按「儲存到本機瀏覽器」）', 'ok');
    }

    markDirty(true);
    exitEditMode();
    renderList();
}

function persistToBrowser() {
    if (entries.length === 0) {
        setStatus('至少需要一筆品項才能儲存', 'error');
        return;
    }

    const result = saveEntriesToLocalStorage(entries);
    if (!result.ok) {
        setStatus('寫入瀏覽器失敗（可能是隱私模式或空間不足）', 'error');
        return;
    }

    sourceLabel = 'local';
    markDirty(false);
    setStatus('已儲存到本機瀏覽器。回抽籤頁會使用這份清單。', 'ok');
}

function downloadVendor() {
    if (entries.length === 0) {
        setStatus('沒有可下載的品項', 'error');
        return;
    }
    downloadTextFile('vendor.txt', serializeMenuEntries(entries));
    setStatus('已開始下載 vendor.txt。覆蓋專案檔後 commit 即可同步到 GitHub。', 'ok');
}

async function loadFromFileOnly() {
    setStatus('正在讀取 vendor.txt…');
    try {
        const text = await fetchVendorFileText();
        const parsed = parseVendorText(text);
        if (parsed.length === 0) {
            throw new Error('No valid entries');
        }
        clearStoredMenuText();
        entries = parsed;
        sourceLabel = 'file';
        markDirty(false);
        exitEditMode();
        renderList();
        setStatus('已還原為 vendor.txt，並清除本機覆寫。', 'ok');
    } catch (error) {
        console.error(error);
        setStatus('讀取 vendor.txt 失敗，請確認用本地伺服器開啟。', 'error');
    }
}

async function init() {
    setStatus('載入中…');
    try {
        const result = await loadMenuEntriesFromSource();
        entries = result.entries;
        sourceLabel = result.source;
        markDirty(false);
        renderList();
        if (result.source === 'local') {
            setStatus('已載入本機瀏覽器覆寫版選單。', 'ok');
        } else {
            setStatus('已載入 vendor.txt。新增後請按「儲存到本機瀏覽器」。', 'info');
        }
    } catch (error) {
        console.error(error);
        entries = [];
        renderList();
        setStatus('選單載入失敗，請用 python -m http.server 開啟後再試。', 'error');
    }
}

entryForm.addEventListener('submit', upsertFromForm);
cancelEditBtn.addEventListener('click', exitEditMode);
persistBtn.addEventListener('click', persistToBrowser);
downloadBtn.addEventListener('click', downloadVendor);
reloadFileBtn.addEventListener('click', () => {
    if (dirty && !confirm('有未儲存變更，確定還原為檔案版？')) {
        return;
    }
    loadFromFileOnly();
});
searchInput.addEventListener('input', renderList);

init();
