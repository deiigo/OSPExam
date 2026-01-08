// Initialize Supabase Client
// db.js で初期化されているため、ここでは再定義しない
// const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// DBインスタンスの初期化（他のファイルでの初期化を待つのではなく、ここで使えるように）
// db.js は supabaseClient グローバル変数を想定しているため問題なし

document.addEventListener('DOMContentLoaded', () => {
    // 認証監視
    Auth.initAuthObserver(async (user) => {
        if (!user) {
            // 未ログインならホームへ
            window.location.href = 'index.html';
            return;
        }

        // ユーザー情報表示
        renderUserProfile(user);

        // 履歴取得と表示
        await loadExamHistory(user.id);
    });
});

function renderUserProfile(user) {
    const avatar = user.user_metadata.avatar_url || 'images/default_user.png';
    const name = user.user_metadata.full_name || user.email;

    // ヘッダー用
    document.getElementById('header-avatar').src = avatar;
    document.getElementById('header-name').textContent = name;

    // ページ用
    document.getElementById('page-avatar').src = avatar;
    document.getElementById('page-name').textContent = name;
}

async function loadExamHistory(userId) {
    const $loading = $('#loading');
    const $container = $('#history-container');
    const $tbody = $('#history-list');
    const $noHistory = $('#no-history');

    try {
        const results = await DB.fetchExamResults(userId);
        $loading.hide();

        if (results.length === 0) {
            $noHistory.show();
            return;
        }

        $container.show();
        $tbody.empty();

        results.forEach(result => {
            const date = new Date(result.created_at).toLocaleString('ja-JP');
            const mode = getModeName(result.exam_mode);
            const scoreClass = getScoreClass(result.correct_rate);

            const row = `
                <tr>
                    <td>${date}</td>
                    <td>${mode}</td>
                    <td>${result.score} / ${result.total_questions}</td>
                    <td><span class="score-badge ${scoreClass}">${result.correct_rate}%</span></td>
                </tr>
            `;
            $tbody.append(row);
        });

    } catch (error) {
        console.error('Failed to load history:', error);
        $loading.text('履歴の取得に失敗しました。');
    }
}

function getModeName(modeKey) {
    const map = {
        'exam1': '模擬試験 1',
        'exam2': '模擬試験 2',
        'exam3': '模擬試験 3',
        'random': 'ランダム出題',
        'single': '1問1答'
    };
    return map[modeKey] || modeKey;
}

function getScoreClass(rate) {
    if (rate >= 80) return 'score-high';
    if (rate >= 60) return 'score-mid';
    return 'score-low';
}
