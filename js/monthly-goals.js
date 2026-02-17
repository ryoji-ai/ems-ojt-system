/**
 * 今月の訓練目標データ
 * 
 * 【更新手順】
 * 1. 新しい月のエントリを下記に追加する（"YYYY-MM" 形式）
 * 2. goals 配列にその月の訓練目標を追加する
 * 3. GitHubにpushする
 * 
 * 過去月のデータは削除しなくてOK（当月分のみ自動表示）
 */
const MONTHLY_GOALS = {
    "2026-02": {
        goals: [
            {
                title: "心肺蘇生法の手順確認",
                description: "CPR手順を確認し、BVM換気の実技訓練を実施する"
            },
            {
                title: "12誘導心電図の電極装着",
                description: "正確な電極配置（V1〜V6）を確認し、実技で練習する"
            }
        ],
        formUrl: "" // 空の場合は既存のGOOGLE_FORM_URLを使用
    }
    // ── 来月以降の例 ──
    // "2026-03": {
    //     goals: [
    //         {
    //             title: "訓練目標タイトル",
    //             description: "訓練目標の詳細説明"
    //         }
    //     ],
    //     formUrl: ""
    // }
};
