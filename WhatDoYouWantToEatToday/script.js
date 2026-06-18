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
const clashVs = document.getElementById('clash-vs');
const arenaStatusPanel = document.getElementById('arena-status-panel');
const arenaCountdown = document.getElementById('arena-countdown');
const arenaWinner = document.getElementById('arena-winner');
const winnerLabel = document.getElementById('winner-label');
const winnerPick = document.getElementById('winner-pick');

const defaultButtonText = '抽籤！';
const drawingButtonText = '開獎中...';
const loadingButtonText = '載入中...';
const emptyMenuText = '尚未設定選單';
const CLASH_WINDUP_MS = 1200;
const COUNTDOWN_SECONDS = 4;
const BEAM_PUSH_MS = 1500;

let menuEntries = [];
let adultResult = null;
let kidResult = null;
let battlePhase = 'idle';
let windupTimer = null;
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

function isSameEntry(a, b) {
    return Boolean(a && b && a.category === b.category && a.vendor === b.vendor);
}

function getAvailableEntries(excludeEntry) {
    if (!excludeEntry) {
        return menuEntries;
    }

    return menuEntries.filter((entry) => !isSameEntry(entry, excludeEntry));
}

function bothResultsReady() {
    return Boolean(adultResult && kidResult && !isSameEntry(adultResult, kidResult));
}

function clearBattleTimers() {
    if (windupTimer) {
        clearTimeout(windupTimer);
        windupTimer = null;
    }
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    if (resolveTimer) {
        clearTimeout(resolveTimer);
        resolveTimer = null;
    }
}

function hideStatusPanel() {
    arenaStatusPanel.classList.remove('show-countdown', 'show-winner');
    arenaCountdown.textContent = '';
    arenaCountdown.classList.remove('tick-pop');
    arenaWinner.classList.remove('visible');
}

function showVsState() {
    hideStatusPanel();
    clashVs.hidden = false;
}

function showCountdownState(value) {
    clashVs.hidden = true;
    arenaStatusPanel.classList.remove('show-winner');
    arenaStatusPanel.classList.add('show-countdown');
    arenaCountdown.textContent = String(value);
    arenaCountdown.classList.remove('tick-pop');
    void arenaCountdown.offsetWidth;
    arenaCountdown.classList.add('tick-pop');
}

function showWinnerState(winnerName, winnerEntry) {
    clashVs.hidden = true;
    arenaStatusPanel.classList.remove('show-countdown');
    arenaStatusPanel.classList.add('show-winner');
    winnerLabel.textContent = `${winnerName} 獲勝！`;
    winnerPick.textContent = formatPick(winnerEntry);
    arenaWinner.classList.remove('visible');
    void arenaWinner.offsetWidth;
    arenaWinner.classList.add('visible');
}

function syncArenaClasses() {
    const adultReady = Boolean(adultResult);
    const kidReady = Boolean(kidResult);
    const bothReady = adultReady && kidReady;
    const isClashing = battlePhase === 'clashing' || battlePhase === 'countdown' || battlePhase === 'resolving';

    kiClashArena.classList.toggle('adult-ready', adultReady);
    kiClashArena.classList.toggle('kid-ready', kidReady);
    kiClashArena.classList.toggle('clash-active', bothReady && isClashing);
    kiClashArena.classList.toggle('countdown-active', battlePhase === 'countdown');
    kiClashArena.classList.toggle('clash-resolving', battlePhase === 'resolving');
    kiClashArena.classList.toggle('battle-ended', battlePhase === 'ended');
    kiClashArena.classList.toggle('adult-wins', battlePhase === 'resolving' || battlePhase === 'ended' ? kiClashArena.dataset.winner === 'adult' : false);
    kiClashArena.classList.toggle('kid-wins', battlePhase === 'resolving' || battlePhase === 'ended' ? kiClashArena.dataset.winner === 'kid' : false);
}

function resetBattleResolution() {
    clearBattleTimers();
    battlePhase = 'idle';
    delete kiClashArena.dataset.winner;
    showVsState();
    syncArenaClasses();
}

function resolveBattle() {
    const adultWins = Math.random() < 0.5;
    const winnerSide = adultWins ? 'adult' : 'kid';
    const winnerEntry = adultWins ? adultResult : kidResult;
    const winnerName = adultWins ? '大人' : '小朋友';

    battlePhase = 'resolving';
    kiClashArena.dataset.winner = winnerSide;
    syncArenaClasses();
    arenaHint.textContent = '勝負揭曉！氣功波衝向落敗方！';

    resolveTimer = setTimeout(() => {
        battlePhase = 'ended';
        syncArenaClasses();
        showWinnerState(winnerName, winnerEntry);
        arenaHint.textContent = `今天就吃 ${formatPick(winnerEntry)}！`;
    }, BEAM_PUSH_MS);
}

function startCountdown() {
    if (battlePhase !== 'clashing') {
        return;
    }

    battlePhase = 'countdown';
    syncArenaClasses();

    let remaining = COUNTDOWN_SECONDS;
    showCountdownState(remaining);
    arenaHint.textContent = `倒數 ${remaining} 秒判定勝負！`;

    countdownTimer = setInterval(() => {
        remaining -= 1;

        if (remaining > 0) {
            showCountdownState(remaining);
            arenaHint.textContent = `倒數 ${remaining} 秒判定勝負！`;
            return;
        }

        clearInterval(countdownTimer);
        countdownTimer = null;
        resolveBattle();
    }, 1000);
}

function beginBattleSequence() {
    if (battlePhase !== 'idle' || !adultResult || !kidResult) {
        return;
    }

    if (isSameEntry(adultResult, kidResult)) {
        arenaHint.textContent = '兩邊選到一樣了！請其中一方重新抽籤（不可重複）';
        return;
    }

    battlePhase = 'clashing';
    syncArenaClasses();
    showVsState();
    arenaHint.textContent = `${formatPick(adultResult)} 與 ${formatPick(kidResult)} 氣功對轟中！`;

    windupTimer = setTimeout(() => {
        windupTimer = null;
        startCountdown();
    }, CLASH_WINDUP_MS);
}

function updateBattleCompare() {
    const adultReady = Boolean(adultResult);
    const kidReady = Boolean(kidResult);
    const bothReady = adultReady && kidReady;

    if (!bothReady && battlePhase !== 'idle') {
        resetBattleResolution();
    }

    compareAdult.textContent = adultResult ? adultResult.category : '？';
    compareKid.textContent = kidResult ? kidResult.category : '？';

    if (battlePhase !== 'idle') {
        syncArenaClasses();
        return;
    }

    syncArenaClasses();

    if (bothReady) {
        if (isSameEntry(adultResult, kidResult)) {
            arenaHint.textContent = '兩邊選到一樣了！請其中一方重新抽籤（不可重複）';
            return;
        }

        beginBattleSequence();
        return;
    }

    if (adultReady) {
        arenaHint.textContent = '大人已蓄氣！等小朋友開獎（不可選相同料理）';
        return;
    }

    if (kidReady) {
        arenaHint.textContent = '小朋友已蓄氣！等大人開獎（不可選相同料理）';
        return;
    }

    arenaHint.textContent = '兩邊各抽一種料理，不可重複，開獎後氣功對決！';
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

function runSlotMachine(entryPool, displayElement, vendorElement, cardElement, buttonElement, onComplete) {
    if (entryPool.length === 0) {
        return false;
    }

    buttonElement.disabled = true;
    buttonElement.textContent = drawingButtonText;
    cardElement.classList.remove('winner');
    displayElement.classList.add('spinning');
    vendorElement.textContent = '';

    let counter = 0;
    const duration = 2000;
    const spinInterval = 60;

    const timer = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * entryPool.length);
        displayElement.textContent = entryPool[randomIndex].category;
        counter += spinInterval;

        if (counter >= duration) {
            clearInterval(timer);
            displayElement.classList.remove('spinning');

            const finalIndex = Math.floor(Math.random() * entryPool.length);
            const finalEntry = entryPool[finalIndex];
            displayElement.textContent = finalEntry.category;
            vendorElement.textContent = finalEntry.vendor;

            cardElement.classList.add('winner');
            buttonElement.textContent = defaultButtonText;
            buttonElement.disabled = false;
            onComplete(finalEntry);
        }
    }, spinInterval);

    return true;
}

function startSpin(side) {
    const isAdult = side === 'adult';
    const otherResult = isAdult ? kidResult : adultResult;
    const entryPool = getAvailableEntries(otherResult);
    const card = document.querySelector(isAdult ? '.adult-card' : '.kid-card');
    const displayElement = isAdult ? adultDisplay : kidDisplay;
    const vendorElement = isAdult ? adultVendor : kidVendor;
    const buttonElement = isAdult ? adultBtn : kidBtn;
    const sideLabel = isAdult ? '大人' : '小朋友';
    const otherLabel = isAdult ? '小朋友' : '大人';

    if (entryPool.length === 0) {
        arenaHint.textContent = `${sideLabel}沒有其他選項可抽了，請${otherLabel}重新抽籤！`;
        return;
    }

    const started = runSlotMachine(
        entryPool,
        displayElement,
        vendorElement,
        card,
        buttonElement,
        (result) => handleSpinResult(side, result)
    );

    if (!started) {
        arenaHint.textContent = `${sideLabel}沒有其他選項可抽了，請${otherLabel}重新抽籤！`;
    }
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

adultBtn.addEventListener('click', () => startSpin('adult'));
kidBtn.addEventListener('click', () => startSpin('kid'));

loadMenuEntries();