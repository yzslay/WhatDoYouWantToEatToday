// 料理選單由 vendor.txt 載入（第一欄：料理種類，第二欄：店家）
const adultBtn = document.getElementById('adult-btn');
const kidBtn = document.getElementById('kid-btn');
const adultDisplay = document.getElementById('adult-display');
const kidDisplay = document.getElementById('kid-display');
const adultVendor = document.getElementById('adult-vendor');
const kidVendor = document.getElementById('kid-vendor');
const kiClashArena = document.getElementById('ki-clash-arena');
const arenaHint = document.getElementById('arena-hint');
const compareAdult = document.getElementById('compare-adult');
const compareKid = document.getElementById('compare-kid');

const defaultButtonText = '抽籤！';
const drawingButtonText = '開獎中...';
const loadingButtonText = '載入中...';
const emptyMenuText = '尚未設定選單';

let menuEntries = [];
let adultResult = null;
let kidResult = null;

function parseVendorText(text) {
    return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
            const [category, vendor] = line.split('||').map((part) => part.trim());
            if (!category || !vendor) {
                return null;
            }
            return { category, vendor };
        })
        .filter(Boolean);
}

function formatPick(entry) {
    return `${entry.category} · ${entry.vendor}`;
}

function updateBattleCompare() {
    const adultReady = Boolean(adultResult);
    const kidReady = Boolean(kidResult);
    const bothReady = adultReady && kidReady;

    kiClashArena.classList.toggle('adult-ready', adultReady);
    kiClashArena.classList.toggle('kid-ready', kidReady);
    kiClashArena.classList.toggle('clash-active', bothReady);

    compareAdult.textContent = adultResult ? adultResult.category : '？';
    compareKid.textContent = kidResult ? kidResult.category : '？';

    if (bothReady) {
        arenaHint.textContent = `${formatPick(adultResult)} 與 ${formatPick(kidResult)} 氣功對轟中！`;
        return;
    }

    if (adultReady) {
        arenaHint.textContent = '大人已蓄氣！等小朋友開獎後對轟！';
        return;
    }

    if (kidReady) {
        arenaHint.textContent = '小朋友已蓄氣！等大人開獎後對轟！';
        return;
    }

    arenaHint.textContent = '兩邊都開獎後，氣功對轟開始！';
}

function setButtonsEnabled(enabled) {
    adultBtn.disabled = !enabled;
    kidBtn.disabled = !enabled;
    adultBtn.textContent = enabled ? defaultButtonText : loadingButtonText;
    kidBtn.textContent = enabled ? defaultButtonText : loadingButtonText;
}

function showMenuLoadError() {
    menuEntries = [];
    adultDisplay.textContent = emptyMenuText;
    kidDisplay.textContent = emptyMenuText;
    adultVendor.textContent = '請確認 vendor.txt 存在，並用本地伺服器開啟網頁';
    kidVendor.textContent = '';
    setButtonsEnabled(false);
    arenaHint.textContent = '料理選單載入失敗，請檢查 vendor.txt';
}

async function loadMenuEntries() {
    setButtonsEnabled(false);

    try {
        const response = await fetch('vendor.txt');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        menuEntries = parseVendorText(await response.text());
        if (menuEntries.length === 0) {
            throw new Error('No valid entries');
        }

        adultDisplay.textContent = '？ ？ ？';
        kidDisplay.textContent = '？ ？ ？';
        adultVendor.textContent = '';
        kidVendor.textContent = '';
        setButtonsEnabled(true);
    } catch (error) {
        console.error('Failed to load vendor.txt', error);
        showMenuLoadError();
    }
}

function runSlotMachine(entryArray, displayElement, vendorElement, cardElement, buttonElement, onComplete) {
    buttonElement.disabled = true;
    buttonElement.textContent = drawingButtonText;
    cardElement.classList.remove('winner');
    displayElement.classList.add('spinning');
    vendorElement.textContent = '';

    let counter = 0;
    const duration = 2000;
    const spinInterval = 60;

    const timer = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * entryArray.length);
        displayElement.textContent = entryArray[randomIndex].category;
        counter += spinInterval;

        if (counter >= duration) {
            clearInterval(timer);
            displayElement.classList.remove('spinning');

            const finalIndex = Math.floor(Math.random() * entryArray.length);
            const finalEntry = entryArray[finalIndex];
            displayElement.textContent = finalEntry.category;
            vendorElement.textContent = finalEntry.vendor;

            cardElement.classList.add('winner');
            buttonElement.textContent = defaultButtonText;
            buttonElement.disabled = false;
            onComplete(finalEntry);
        }
    }, spinInterval);
}

adultBtn.addEventListener('click', () => {
    const card = document.querySelector('.adult-card');
    runSlotMachine(menuEntries, adultDisplay, adultVendor, card, adultBtn, (result) => {
        adultResult = result;
        updateBattleCompare();
    });
});

kidBtn.addEventListener('click', () => {
    const card = document.querySelector('.kid-card');
    runSlotMachine(menuEntries, kidDisplay, kidVendor, card, kidBtn, (result) => {
        kidResult = result;
        updateBattleCompare();
    });
});

loadMenuEntries();