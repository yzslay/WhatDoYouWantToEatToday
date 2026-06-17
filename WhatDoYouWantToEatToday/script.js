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
const clashCore = document.getElementById('clash-core');
const clashVs = document.getElementById('clash-vs');
const clashCountdown = document.getElementById('clash-countdown');
const winnerReveal = document.getElementById('winner-reveal');
const winnerLabel = document.getElementById('winner-label');
const winnerPick = document.getElementById('winner-pick');

const defaultButtonText = '抽籤！';
const drawingButtonText = '開獎中...';
const loadingButtonText = '載入中...';
const emptyMenuText = '尚未設定選單';
const COUNTDOWN_SECONDS = 5;
const BEAM_PUSH_MS = 1400;

let menuEntries = [];
let adultResult = null;
let kidResult = null;
let battlePhase = 'idle';
let countdownTimer = null;
let resolveTimer = null;

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

function clearBattleTimers() {
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    if (resolveTimer) {
        clearTimeout(resolveTimer);
        resolveTimer = null;
    }
}

function resetBattleResolution() {
    clearBattleTimers();
    battlePhase = 'idle';

    kiClashArena.classList.remove(
        'countdown-active',
        'clash-resolving',
        'battle-ended',
        'adult-wins',
        'kid-wins'
    );

    clashVs.hidden = false;
    clashCountdown.hidden = true;
    clashCountdown.textContent = String(COUNTDOWN_SECONDS);
    clashCountdown.classList.remove('tick-pop');

    winnerReveal.hidden = true;
    winnerReveal.classList.remove('visible');
    clashCore.classList.remove('prize-reveal');
}

function showCenterCountdown(value) {
    clashVs.hidden = true;
    winnerReveal.hidden = true;
    clashCountdown.hidden = false;
    clashCountdown.textContent = String(value);
    clashCountdown.classList.remove('tick-pop');
    void clashCountdown.offsetWidth;
    clashCountdown.classList.add('tick-pop');
}

function startBattleCountdown() {
    if (battlePhase !== 'idle') {
        return;
    }

    battlePhase = 'countdown';
    kiClashArena.classList.add('countdown-active');

    let remaining = COUNTDOWN_SECONDS;
    showCenterCountdown(remaining);
    arenaHint.textContent = '氣功對轟中！倒數判定勝負…';

    countdownTimer = setInterval(() => {
        remaining -= 1;

        if (remaining > 0) {
            showCenterCountdown(remaining);
            return;
        }

        clearInterval(countdownTimer);
        countdownTimer = null;
        resolveBattle();
    }, 1000);
}

function resolveBattle() {
    const adultWins = Math.random() < 0.5;
    const winnerEntry = adultWins ? adultResult : kidResult;
    const winnerName = adultWins ? '大人' : '小朋友';

    battlePhase = 'resolving';
    kiClashArena.classList.remove('countdown-active');
    kiClashArena.classList.add('clash-resolving', adultWins ? 'adult-wins' : 'kid-wins');

    clashCountdown.hidden = true;
    clashVs.hidden = true;
    arenaHint.textContent = '勝負揭曉！氣功波衝向落敗方！';

    resolveTimer = setTimeout(() => {
        battlePhase = 'resolved';
        kiClashArena.classList.remove('clash-active', 'clash-resolving');
        kiClashArena.classList.add('battle-ended');

        winnerLabel.textContent = `${winnerName} 獲勝！`;
        winnerPick.textContent = formatPick(winnerEntry);
        winnerReveal.hidden = false;
        winnerReveal.classList.remove('visible');
        void winnerReveal.offsetWidth;
        winnerReveal.classList.add('visible');
        clashCore.classList.add('prize-reveal');

        arenaHint.textContent = `今晚就吃 ${formatPick(winnerEntry)}！`;
    }, BEAM_PUSH_MS);
}

function updateBattleCompare() {
    const adultReady = Boolean(adultResult);
    const kidReady = Boolean(kidResult);
    const bothReady = adultReady && kidReady;

    if (!bothReady && battlePhase !== 'idle') {
        resetBattleResolution();
    }

    kiClashArena.classList.toggle('adult-ready', adultReady);
    kiClashArena.classList.toggle('kid-ready', kidReady);
    kiClashArena.classList.toggle('clash-active', bothReady && battlePhase === 'idle');

    compareAdult.textContent = adultResult ? adultResult.category : '？';
    compareKid.textContent = kidResult ? kidResult.category : '？';

    if (battlePhase === 'countdown' || battlePhase === 'resolving' || battlePhase === 'resolved') {
        return;
    }

    if (bothReady) {
        arenaHint.textContent = `${formatPick(adultResult)} 與 ${formatPick(kidResult)} 氣功對轟中！`;
        startBattleCountdown();
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

function handleSpinResult(side, result) {
    if (battlePhase !== 'idle') {
        resetBattleResolution();
    }

    if (side === 'adult') {
        adultResult = result;
    } else {
        kidResult = result;
    }

    updateBattleCompare();
}

adultBtn.addEventListener('click', () => {
    const card = document.querySelector('.adult-card');
    runSlotMachine(menuEntries, adultDisplay, adultVendor, card, adultBtn, (result) => {
        handleSpinResult('adult', result);
    });
});

kidBtn.addEventListener('click', () => {
    const card = document.querySelector('.kid-card');
    runSlotMachine(menuEntries, kidDisplay, kidVendor, card, kidBtn, (result) => {
        handleSpinResult('kid', result);
    });
});

loadMenuEntries();