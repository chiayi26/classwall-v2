# 任務：一鍵 Ship 一個小功能 🚀

先讀檔：

- #file:AGENTS.md
- #file:.github/prompts/add-skill.prompt.md
- #file:.github/prompts/add-page.prompt.md
- #file:.github/prompts/add-feature-likes-rank.prompt.md

---

## description: "把「加一個小功能」從計畫到 PR 一條龍打包（plan → code → verify → commit → PR）"

任務說明

- 目的：當學生輸入 `/ship-feature <一句話描述>`，協助他把一個小功能從規劃到 PR 自動化指引與固定步驟。

使用方式（範例）

- `/ship-feature 首頁加依讚數排序按鈕`
- `/ship-feature 問題卡顯示 created_at`
- `/ship-feature 新增 /about 頁面`

執行步驟（依序，禁止跳）

1. 🔎 讀規範並列重點
   - 讀取 `AGENTS.md` 全文，以及任何會被影響的 `.github/instructions/*.instructions.md`（按 glob 比對）。
   - 列出 3-5 條最相關的規則（例如：Tailwind v4 gradient 命名、Supabase schema 改法、不能在 main commit、按讚要用 RPC 等）。

2. 🧾 查 Supabase schema（只讀）
   - 使用 Supabase MCP 或者請使用者貼 schema。**只允許 `SELECT`**，禁止 `INSERT/UPDATE/DELETE`。
   - 回報表與資料量摘要（例如：`questions` ~ N rows、是否有 `likes` 欄位）。

3. 📝 提計畫（停等使用者確認）
   - 列出要改的檔案清單、必要的 schema 補丁（若有）、風險評估、建議的 branch 名稱與 commit message、建議的 PR title。
   - **在這一步：停下來等使用者回覆「OK 開始動」才能繼續。**

4. 🛠 實作（在新分支）
   - 建分支：`git checkout -b feat/<slug>` 或 `fix/<slug>` 視內容而定。
   - 實作範圍不超計畫。Tailwind v4 必用 `bg-linear-*`（非 `bg-gradient-*`）。
   - 若改 schema：把改動寫入 `supabase/migrations/0001_init.sql`（保持冪等，使用 `create if not exists` / `alter`）。
   - 按讚邏輯或其他敏感更新：一律使用現有 RPC（例如 `increment_question_like`），不要直接讓前端 UPDATE likes。

5. ✅ 驗證（依序執行）
   - `pnpm lint`，若失敗顯示錯誤並停下修正。
   - `pnpm format:check`，若失敗先 run `pnpm format` 再檢查。
   - `pnpm build`（或 `npm run build`），任一失敗均停下並回報。
   - 不允許使用 `--no-verify` 或 `--force` 跳過檢查。

6. 📦 Commit 與 PR
   - 建分支並 commit：

```bash
git checkout -b feat/<slug>
git add .
git commit -m "feat(<area>): <short description>"
git push -u origin HEAD
```

- 建 PR（使用 `gh`）：

```bash
gh pr create --title "<PR title>" --body <<'EOF'
Summary:
- <一兩行 summary>

Test plan:
- [ ] pnpm lint
- [ ] pnpm format:check
- [ ] pnpm build

Notes:
- 密切注意 Supabase schema 變更與 RLS
EOF
```

規範（必須遵守）

- 絕不跳過 Plan 步驟。
- 絕不在 `main` 直接 commit。
- 失敗不准用 `--no-verify` / `--force` 跳過驗證。
- 不要 commit `node_modules` / `.next` / `.env*`。

常見卡關（與應對）

- Supabase MCP 沒裝：在第 2 步提示使用者安裝 MCP，或請他貼 schema。
- `gh` 未登入：在第 6 步提示 `gh auth login`。
- lint/build 失敗：印出錯誤摘要並問使用者要「修還是回頭改計畫」。

風格與語氣

- 與 `.github/prompts/add-skill.prompt.md` 同風格：繁體中文、emoji 標題、bullet 為主，方便學生快速掃讀。

備註

- 這支 prompt 只建立到提出變更並協助開 PR；若要讓 Copilot 自動執行變更，請確保本機環境有 `gh`、`pnpm`、Supabase MCP，並先回覆 OK 開始動。
