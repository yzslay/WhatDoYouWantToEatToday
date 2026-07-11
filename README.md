# 用餐一番賞 · DINING KUJI

幫「大人」和「小朋友」各自抽一道料理，兩邊都開獎後進入 **氣功對決**，隨機決定今天吃哪一家。

純前端靜態網頁（HTML / CSS / JS），選單資料放在 `vendor.txt`，改檔即可調整店家，不必改程式。

---

## 專案結構

```
WhatDoYouWantToEatToday/
├── README.md                          # 本說明
├── .gitignore
└── WhatDoYouWantToEatToday/           # 網頁本體
    ├── index.html                     # 抽籤主頁
    ├── edit.html                      # 選單編輯頁
    ├── style.css                      # 主頁樣式與氣功動畫
    ├── edit.css                       # 編輯頁樣式
    ├── menu.js                        # 選單解析 / localStorage / 下載
    ├── script.js                      # 抽籤、對決邏輯
    ├── edit.js                        # 編輯頁邏輯
    ├── vendor.txt                     # 料理 / 店家選單
    └── Gemini_Generated_Image_....png # Logo、favicon、背景浮水印
```

| 檔案 | 角色 |
|------|------|
| `index.html` | 品牌標題、雙人拉霸卡片、氣功對決區 |
| `edit.html` | 線上新增 / 編輯 / 刪除品項 |
| `menu.js` | 共用選單載入（檔案或本機覆寫） |
| `script.js` | 拉霸動畫、對決流程、勝負判定 |
| `style.css` / `edit.css` | 主頁與編輯頁樣式 |
| `vendor.txt` | 預設料理清單（也可下載覆蓋） |
| `Gemini_...png` | 視覺素材 |

---

## 怎麼開啟

`script.js` 會用 `fetch` 讀取 `vendor.txt`。若直接雙擊用 `file://` 開 HTML，瀏覽器通常會擋掉跨檔讀取，導致選單載入失敗。

請用**本地伺服器**開啟，例如在 `WhatDoYouWantToEatToday/WhatDoYouWantToEatToday` 目錄下：

```bash
# Python
python -m http.server 8080

# 或 Node（若有 npx）
npx serve .
```

瀏覽器開啟：

- 抽籤：`http://localhost:8080/` 或 `http://localhost:8080/index.html`
- 編輯選單：`http://localhost:8080/edit.html`

---

## 編輯選單（`edit.html`）

可在 `python -m http.server 8080` 下直接新增、修改、刪除品項。

**重要限制：** 內建的 `http.server` **不能寫回** 硬碟上的 `vendor.txt`，因此採用：

| 操作 | 實際效果 |
|------|----------|
| 儲存到本機瀏覽器 | 寫入 `localStorage`；**同一瀏覽器**的抽籤頁會優先用這份 |
| 下載 vendor.txt | 下載文字檔，覆蓋專案內檔案後再 commit → 同步 GitHub / 其他人 |
| 還原為檔案版 | 清除本機覆寫，改回讀取 `vendor.txt` |

建議流程（本機試完要上 GitHub）：

1. 開 `edit.html` 新增品項 → 按「儲存到本機瀏覽器」試抽  
2. 滿意後按「下載 vendor.txt」覆蓋專案檔  
3. `git add` / `commit` / `push`

---

## 頁面功能總覽

### 1. 品牌區

- 標題：**用餐一番賞**
- 副標：`DINING KUJI`
- 背景為黃→橙漸層，中央有 Logo 浮水印

### 2. 雙人拉霸（抽籤）

左右兩張卡片，可獨立操作：

| 卡片 | 用途 |
|------|------|
| 👨 大人吃什麼？ | 大人抽一種料理 + 對應店家 |
| 👦 小朋友吃什麼？ | 小朋友抽一種料理 + 對應店家 |

**操作流程：**

1. 點「抽籤！」→ 按鈕變成「開獎中...」並鎖定
2. 顯示區約 2 秒快速輪播料理種類（拉霸感）
3. 停止後顯示：
   - **料理種類**（大字）
   - **店家名稱**（小字）
4. 卡片加上得獎高亮

**規則：**

- 兩邊**不可抽到同一筆**（相同料理 + 相同店家）
- 一方已開獎時，另一方的候選會排除對方結果
- 若選單只剩對方那一筆，會提示請對方重新抽

### 3. 氣功對決區

兩邊都開出**不同**結果後，自動進入對決（無需再按按鈕）。

| 階段 | 說明 |
|------|------|
| 蓄氣 | 只有一方開獎時，提示等待另一方 |
| 對轟 wind-up | 約 1.2 秒，顯示雙方料理 VS 氣功波 |
| 倒數 | 4 → 1 秒，畫面中央倒數 |
| 判定 | 50/50 隨機決定大人或小朋友勝出 |
| 揭曉 | 約 1.5 秒氣功波動畫後，顯示「○○ 獲勝！」與今日料理 |

任一方在對決中途**重新抽籤**會重置對決狀態，並以新結果重新比對。

### 4. 料理選單（`vendor.txt`）

純文字檔，格式：

```text
# 註解以 # 開頭，空白行會忽略
料理種類 || 店家名稱
```

範例：

```text
台式便當與烤肉飯 || 烤師傅烤肉飯
現燒日式丼飯與咖哩 || Sukiya
日本生魚片 || 壽司郎、大鵬
```

- 以 `||` 分隔兩欄，前後空白會被 trim
- 缺欄或格式錯誤的行會被略過
- 預設約 30+ 筆（含基隆路一段／市政府周邊補充）；可用 `edit.html` 增刪

---

## 使用流程（使用者視角）

```
開啟網頁 → 載入 vendor.txt
    ↓
大人抽籤 ／ 小朋友抽籤（可先後、可重抽）
    ↓
兩邊結果不同 → 自動氣功對決
    ↓
倒數 → 隨機勝負 → 顯示今天吃什麼
```

---

## 技術摘要

| 項目 | 說明 |
|------|------|
| 技術棧 | 原生 HTML / CSS / JS，無框架、無建置 |
| 資料來源 | `fetch('vendor.txt')` 執行期載入 |
| 狀態 | 記憶體內 `adultResult` / `kidResult` / `battlePhase` |
| 對決勝負 | `Math.random() < 0.5`（公平 50/50） |
| 響應式 | 卡片可換行；標題字級用 `clamp` |
| 無後端 | 不需資料庫、不需 API key |

### 主要邏輯對照（`script.js`）

| 函式 | 職責 |
|------|------|
| `loadMenuEntries` | 載入並解析 `vendor.txt` |
| `parseVendorText` | 解析選單文字 |
| `runSlotMachine` | 拉霸輪播與開獎 |
| `startSpin` / `handleSpinResult` | 單邊抽籤與結果寫入 |
| `getAvailableEntries` | 排除對方已抽結果 |
| `beginBattleSequence` → `startCountdown` → `resolveBattle` | 對決狀態機 |
| `updateBattleCompare` | 同步對決區 UI 與提示文字 |

### 對決狀態（`battlePhase`）

`idle` → `clashing` → `countdown` → `resolving` → `ended`

---

## 已知限制（後續加功能時可參考）

1. **必須本地伺服器**才能讀 `vendor.txt`（`file://` 不可用）
2. **編輯無法直接寫磁碟**：`http.server` 只能本機瀏覽器 + 下載覆蓋
3. **本機覆寫不跨裝置**：`localStorage` 只在當前瀏覽器；要共用請下載後 push
4. **勝負純隨機**，無權重、無歷史紀錄
5. **無音效 / 無分享**
6. 對決結果重整即清空（選單本身可本機保存）

---

## 後續可討論的方向（暫不實作）

- [x] 選單管理介面（`edit.html` + localStorage + 下載）
- [ ] 權重抽籤（常吃的降權、想試的加權）
- [ ] 歷史紀錄與「最近吃過」排除（可先 localStorage）
- [ ] 三人以上或「全家人一起決定」
- [ ] 音效、震動、PWA 離線使用
- [ ] 結果截圖 / 分享連結

有想做的功能時，直接說優先順序即可一起規劃實作。
