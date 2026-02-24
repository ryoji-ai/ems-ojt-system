/**
 * sync-monthly-goals.js
 *
 * annual-plan-2026.json を読み込み、js/monthly-goals.js を自動更新するスクリプト。
 *
 * 実行方法:
 *   node docs/sync-monthly-goals.js
 */

const fs = require('fs');
const path = require('path');

const PLAN_FILE = path.join(__dirname, 'annual-plan-2026.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'js', 'monthly-goals.js');

// JSONを読み込む
const plan = JSON.parse(fs.readFileSync(PLAN_FILE, 'utf8'));

// MONTHLY_GOALS オブジェクトを構築
const monthlyGoals = {};
for (const [month, data] of Object.entries(plan.months)) {
    monthlyGoals[month] = {
        goals: data.goals.map(g => ({ title: g.title, description: g.description })),
        formUrl: ''
    };
}

// JS ファイルとして出力
const entries = Object.entries(monthlyGoals)
    .map(([month, data]) => {
        const goalsStr = data.goals
            .map(g => `            {\n                title: ${JSON.stringify(g.title)},\n                description: ${JSON.stringify(g.description)}\n            }`)
            .join(',\n');
        return `    ${JSON.stringify(month)}: {\n        goals: [\n${goalsStr}\n        ],\n        formUrl: "" // 空の場合は既存の GOOGLE_FORM_URL を使用\n    }`;
    })
    .join(',\n');

const output = `/**
 * 今月の訓練目標データ
 *
 * このファイルは docs/sync-monthly-goals.js により自動生成されます。
 * 訓練内容を変更する場合は docs/annual-plan-2026.json を編集し、
 * 再度 node docs/sync-monthly-goals.js を実行してください。
 *
 * 生成元: ${plan.title}
 * 生成日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
 */
const MONTHLY_GOALS = {
${entries}
};
`;

fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
console.log(`✓ ${OUTPUT_FILE} を更新しました（${Object.keys(monthlyGoals).length}ヶ月分）`);
