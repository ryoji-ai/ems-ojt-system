/**
 * 救急OJT教育システム - メインアプリケーション
 */

// グローバル状態
const state = {
    questions: null,
    currentCategory: null,
    currentSubcategory: null,
    currentQuestionIndex: 0,
    shuffledQuestions: [],
    isRandomMode: false
};

// Google Form URL
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeBCU5BZg7by-3sUljJFsmqI_dT8Qh2jL5alhSlzY7H2QLkDA/viewform';

// DOM要素
const elements = {
    headerTitle: document.getElementById('header-title'),
    backBtn: document.getElementById('back-btn'),
    homeBtn: document.getElementById('home-btn'),
    topScreen: document.getElementById('top-screen'),
    subcategoryScreen: document.getElementById('subcategory-screen'),
    questionScreen: document.getElementById('question-screen'),
    categoryGrid: document.getElementById('category-grid'),
    subcategoryList: document.getElementById('subcategory-list'),
    categoryTitle: document.getElementById('category-title'),
    randomBtn: document.getElementById('random-btn'),
    questionCategory: document.getElementById('question-category'),
    questionType: document.getElementById('question-type'),
    questionTopic: document.getElementById('question-topic'),
    questionText: document.getElementById('question-text'),
    toggleCheckpoints: document.getElementById('toggle-checkpoints'),
    checkPoints: document.getElementById('check-points'),
    checkPointsList: document.getElementById('check-points-list'),
    tips: document.getElementById('tips'),
    nextQuestionBtn: document.getElementById('next-question-btn'),
    changeCategoryBtn: document.getElementById('change-category-btn'),
    recordBtn: document.getElementById('record-btn'),
    offlineNotice: document.getElementById('offline-notice'),
    monthlyGoals: document.getElementById('monthly-goals')
};

/**
 * 質問データを読み込む
 */
function loadQuestions() {
    try {
        // グローバル変数から質問データを取得
        if (typeof QUESTIONS_DATA !== 'undefined') {
            state.questions = QUESTIONS_DATA;
            renderCategories();
        } else {
            throw new Error('QUESTIONS_DATA not found');
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        showError('質問データの読み込みに失敗しました。ページを再読み込みしてください。');
    }
}

/**
 * カテゴリを表示する
 */
function renderCategories() {
    if (!state.questions) return;

    const html = state.questions.categories.map(category => {
        const totalQuestions = category.subcategories.reduce(
            (sum, sub) => sum + sub.questions.length, 0
        );
        return `
            <div class="category-card" data-category-id="${category.id}">
                <div class="category-icon">${category.icon}</div>
                <div class="category-name">${category.name}</div>
                <div class="category-count">${totalQuestions}問</div>
            </div>
        `;
    }).join('');

    elements.categoryGrid.innerHTML = html;

    // 統計情報を表示
    const totalStats = document.getElementById('total-stats');
    if (totalStats) {
        const totalQuestions = state.questions.categories.reduce(
            (sum, cat) => sum + cat.subcategories.reduce(
                (s, sub) => s + sub.questions.length, 0
            ), 0
        );
        const totalCategories = state.questions.categories.length;
        totalStats.textContent = `${totalCategories} カテゴリ / ${totalQuestions} 問`;
    }

    // イベントリスナーを追加
    elements.categoryGrid.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const categoryId = card.dataset.categoryId;
            selectCategory(categoryId);
        });
    });

    // スタッガーアニメーション
    elements.categoryGrid.querySelectorAll('.category-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 60);
    });
}

/**
 * カテゴリを選択する
 */
function selectCategory(categoryId) {
    state.currentCategory = state.questions.categories.find(c => c.id === categoryId);
    state.isRandomMode = false;

    if (!state.currentCategory) return;

    renderSubcategories();
    showScreen('subcategory');
    updateHeader(state.currentCategory.name, true);
}

/**
 * サブカテゴリを表示する
 */
function renderSubcategories() {
    if (!state.currentCategory) return;

    elements.categoryTitle.textContent = state.currentCategory.name;

    const html = state.currentCategory.subcategories.map(subcategory => `
        <div class="subcategory-item" data-subcategory-id="${subcategory.id}">
            <span class="subcategory-name">${subcategory.name}</span>
            <span class="subcategory-count">${subcategory.questions.length}問</span>
        </div>
    `).join('');

    elements.subcategoryList.innerHTML = html;

    // イベントリスナーを追加
    elements.subcategoryList.querySelectorAll('.subcategory-item').forEach(item => {
        item.addEventListener('click', () => {
            const subcategoryId = item.dataset.subcategoryId;
            selectSubcategory(subcategoryId);
        });
    });
}

/**
 * サブカテゴリを選択する
 */
function selectSubcategory(subcategoryId) {
    state.currentSubcategory = state.currentCategory.subcategories.find(
        s => s.id === subcategoryId
    );

    if (!state.currentSubcategory) return;

    // 質問をシャッフル
    state.shuffledQuestions = shuffleArray([...state.currentSubcategory.questions]);
    state.currentQuestionIndex = 0;

    showQuestion();
    showScreen('question');
    updateHeader(state.currentSubcategory.name, true);
}

/**
 * ランダム出題
 */
function randomQuestion() {
    if (!state.questions) return;

    state.isRandomMode = true;

    // すべての質問を収集
    const allQuestions = [];
    state.questions.categories.forEach(category => {
        category.subcategories.forEach(subcategory => {
            subcategory.questions.forEach(question => {
                allQuestions.push({
                    ...question,
                    categoryName: category.name,
                    subcategoryName: subcategory.name
                });
            });
        });
    });

    // シャッフル
    state.shuffledQuestions = shuffleArray(allQuestions);
    state.currentQuestionIndex = 0;

    showQuestion();
    showScreen('question');
    updateHeader('ランダム出題', true);
}

/**
 * 質問を表示する
 */
function showQuestion() {
    const question = state.shuffledQuestions[state.currentQuestionIndex];
    if (!question) return;

    // カテゴリ名を決定
    let categoryName, subcategoryName;
    if (state.isRandomMode) {
        categoryName = question.categoryName;
        subcategoryName = question.subcategoryName;
    } else {
        categoryName = state.currentCategory.name;
        subcategoryName = state.currentSubcategory.name;
    }

    elements.questionCategory.textContent = `${categoryName} > ${subcategoryName}`;
    elements.questionType.textContent = question.question_type;
    elements.questionTopic.textContent = question.topic;
    elements.questionText.textContent = question.question;

    // 確認ポイントをリセット
    elements.checkPoints.classList.add('hidden');
    elements.toggleCheckpoints.classList.remove('active');
    elements.toggleCheckpoints.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
        </svg>
        確認ポイントを表示
    `;

    // 確認ポイントを設定
    elements.checkPointsList.innerHTML = question.check_points
        .map(point => `<li>${point}</li>`)
        .join('');

    // Tipsを設定
    if (question.tips) {
        elements.tips.textContent = question.tips;
        elements.tips.style.display = 'block';
    } else {
        elements.tips.style.display = 'none';
    }

    // 質問カウンターを更新
    const counterEl = document.getElementById('question-counter');
    if (counterEl) {
        const current = state.currentQuestionIndex + 1;
        const total = state.shuffledQuestions.length;
        counterEl.textContent = `${current} / ${total}`;
    }

    // 記録ボタンのURLを設定
    elements.recordBtn.href = GOOGLE_FORM_URL;
}

/**
 * 次の質問を表示
 */
function nextQuestion() {
    state.currentQuestionIndex++;

    if (state.currentQuestionIndex >= state.shuffledQuestions.length) {
        // 最初に戻る
        state.currentQuestionIndex = 0;
        // 再シャッフル
        state.shuffledQuestions = shuffleArray(state.shuffledQuestions);
    }

    showQuestion();
}

/**
 * 確認ポイントの表示切り替え
 */
function toggleCheckPoints() {
    const isHidden = elements.checkPoints.classList.contains('hidden');

    if (isHidden) {
        elements.checkPoints.classList.remove('hidden');
        elements.toggleCheckpoints.classList.add('active');
        elements.toggleCheckpoints.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
            </svg>
            確認ポイントを隠す
        `;
    } else {
        elements.checkPoints.classList.add('hidden');
        elements.toggleCheckpoints.classList.remove('active');
        elements.toggleCheckpoints.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
            </svg>
            確認ポイントを表示
        `;
    }
}

/**
 * 今月の訓練目標を表示する
 */
function renderMonthlyGoals() {
    if (typeof MONTHLY_GOALS === 'undefined' || !elements.monthlyGoals) return;

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthData = MONTHLY_GOALS[yearMonth];

    if (!monthData || !monthData.goals || monthData.goals.length === 0) {
        elements.monthlyGoals.classList.add('hidden');
        return;
    }

    const monthLabel = `${now.getMonth() + 1}月`;
    const formUrl = monthData.formUrl || GOOGLE_FORM_URL;

    const goalsHtml = monthData.goals.map(goal => `
        <div class="monthly-goal-item">
            <div class="monthly-goal-marker"></div>
            <div class="monthly-goal-content">
                <div class="monthly-goal-title">${goal.title}</div>
                <div class="monthly-goal-desc">${goal.description}</div>
            </div>
        </div>
    `).join('');

    elements.monthlyGoals.innerHTML = `
        <div class="monthly-goals-header">
            <div class="monthly-goals-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="6"/>
                    <circle cx="12" cy="12" r="2"/>
                </svg>
            </div>
            <div class="monthly-goals-title-group">
                <h2 class="monthly-goals-title">今月の訓練目標</h2>
                <span class="monthly-goals-month">${monthLabel}</span>
            </div>
        </div>
        <div class="monthly-goals-list">
            ${goalsHtml}
        </div>
        <a href="${formUrl}" target="_blank" rel="noopener noreferrer" class="monthly-goals-record-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            訓練を記録する
        </a>
    `;

    elements.monthlyGoals.classList.remove('hidden');

    // 出現アニメーション
    elements.monthlyGoals.style.opacity = '0';
    elements.monthlyGoals.style.transform = 'translateY(12px)';
    setTimeout(() => {
        elements.monthlyGoals.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        elements.monthlyGoals.style.opacity = '1';
        elements.monthlyGoals.style.transform = 'translateY(0)';
    }, 100);
}

/**
 * 画面を切り替える
 */
function showScreen(screenName) {
    // すべての画面を非表示
    elements.topScreen.classList.remove('active');
    elements.subcategoryScreen.classList.remove('active');
    elements.questionScreen.classList.remove('active');

    // 指定された画面を表示
    switch (screenName) {
        case 'top':
            elements.topScreen.classList.add('active');
            break;
        case 'subcategory':
            elements.subcategoryScreen.classList.add('active');
            break;
        case 'question':
            elements.questionScreen.classList.add('active');
            break;
    }
}

/**
 * ヘッダーを更新する
 */
function updateHeader(title, showBackButton) {
    elements.headerTitle.textContent = title;

    if (showBackButton) {
        elements.backBtn.classList.remove('hidden');
        elements.homeBtn.classList.remove('hidden');
    } else {
        elements.backBtn.classList.add('hidden');
        elements.homeBtn.classList.add('hidden');
    }
}

/**
 * 戻るボタンの処理
 */
function goBack() {
    const currentScreen = getCurrentScreen();

    switch (currentScreen) {
        case 'question':
            if (state.isRandomMode) {
                goHome();
            } else {
                showScreen('subcategory');
                updateHeader(state.currentCategory.name, true);
            }
            break;
        case 'subcategory':
            goHome();
            break;
        default:
            goHome();
    }
}

/**
 * ホームに戻る
 */
function goHome() {
    state.currentCategory = null;
    state.currentSubcategory = null;
    state.shuffledQuestions = [];
    state.currentQuestionIndex = 0;
    state.isRandomMode = false;

    showScreen('top');
    updateHeader('救急OJT教育システム', false);
}

/**
 * 現在の画面を取得
 */
function getCurrentScreen() {
    if (elements.questionScreen.classList.contains('active')) return 'question';
    if (elements.subcategoryScreen.classList.contains('active')) return 'subcategory';
    return 'top';
}

/**
 * 配列をシャッフルする（Fisher-Yates）
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * エラーメッセージを表示
 */
function showError(message) {
    elements.categoryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--danger-color);">
            <p>${message}</p>
            <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; cursor: pointer;">
                再読み込み
            </button>
        </div>
    `;
}

/**
 * オフライン状態を監視
 */
function setupOfflineListener() {
    const updateOnlineStatus = () => {
        if (navigator.onLine) {
            elements.offlineNotice.classList.add('hidden');
        } else {
            elements.offlineNotice.classList.remove('hidden');
        }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
}

/**
 * Service Workerを登録
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered:', registration.scope);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}

/**
 * イベントリスナーを設定
 */
function setupEventListeners() {
    elements.backBtn.addEventListener('click', goBack);
    elements.homeBtn.addEventListener('click', goHome);
    elements.randomBtn.addEventListener('click', randomQuestion);
    elements.toggleCheckpoints.addEventListener('click', toggleCheckPoints);
    elements.nextQuestionBtn.addEventListener('click', nextQuestion);
    elements.changeCategoryBtn.addEventListener('click', goHome);

    // ブラウザの戻るボタン対応
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            // 履歴に基づいて画面を復元
        } else {
            goBack();
        }
    });

    // キーボードショートカット
    document.addEventListener('keydown', (event) => {
        if (getCurrentScreen() === 'question') {
            switch (event.key) {
                case 'ArrowRight':
                case 'n':
                    nextQuestion();
                    break;
                case ' ':
                    event.preventDefault();
                    toggleCheckPoints();
                    break;
                case 'Escape':
                    goBack();
                    break;
            }
        }
    });
}

/**
 * アプリケーションを初期化
 */
function init() {
    loadQuestions();
    renderMonthlyGoals();
    setupEventListeners();
    setupOfflineListener();
    registerServiceWorker();
}

// DOMContentLoadedで初期化
document.addEventListener('DOMContentLoaded', init);
