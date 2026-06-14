// 1. 內建初始食物大類選單
const adultFoods = ["米粉湯", "滷肉飯", "日本料理", "雞肉飯", "義大利麵", "麻辣鍋", "牛肉麵"];
const kidFoods = ["咖哩飯", "蛋包飯", "炸雞薯條", "義大利麵", "烏龍麵", "漢堡"];

// 2. 綁定 DOM 元素
const adultBtn = document.getElementById('adult-btn');
const kidBtn = document.getElementById('kid-btn');
const adultDisplay = document.getElementById('adult-display');
const kidDisplay = document.getElementById('kid-display');

// 3. 核心拉霸隨機滾動邏輯
function runSlotMachine(foodArray, displayElement, cardElement, buttonElement) {
    // 避免重複點擊
    buttonElement.disabled = true;
    cardElement.classList.remove('winner');
    displayElement.classList.add('spinning');

    let counter = 0;
    const duration = 2000; // 總共跑 2 秒
    const spinInterval = 60; // 每 0.06 秒換一次字

    // 模擬快速滾動
    const timer = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * foodArray.length);
        displayElement.innerText = foodArray[randomIndex];
        counter += spinInterval;

        // 時間到了就煞車停下
        if (counter >= duration) {
            clearInterval(timer);
            displayElement.classList.remove('spinning');
            
            // 決定最終中獎項目
            const finalIndex = Math.floor(Math.random() * foodArray.length);
            displayElement.innerText = foodArray[finalIndex];
            
            // 加上一番賞中獎發光效果
            cardElement.classList.add('winner');
            buttonElement.disabled = false;
        }
    }, spinInterval);
}

// 4. 監聽按鈕點擊事件（兩邊各自獨立）
adultBtn.addEventListener('click', () => {
    const card = document.querySelector('.adult-card');
    runSlotMachine(adultFoods, adultDisplay, card, adultBtn);
});

kidBtn.addEventListener('click', () => {
    const card = document.querySelector('.kid-card');
    runSlotMachine(kidFoods, kidDisplay, card, kidBtn);
});