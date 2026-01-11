// 模擬試験アプリケーション
$(document).ready(function () {
    // URLパラメータからモードを取得
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    // モードが指定されていない場合はホームにリダイレクト
    if (!mode) {
        window.location.href = 'index.html';
        return;
    }

    // アプリケーション状態
    const state = {
        currentExam: null,
        currentMode: 'exam',
        currentQuestionIndex: 0,
        questions: [],
        answers: {},
        flags: {},
        chart: null,
        timerInterval: null,
        remainingTime: 2 * 60 * 60 // 2時間（秒）
    };

    // 画面切り替え
    function showScreen(screenId) {
        $('.screen').removeClass('active');
        $(`#${screenId}`).addClass('active');
    }

    // 選択肢のラベル
    const choiceLabels = ['A', 'B', 'C', 'D'];

    // 模擬試験モードかどうか（exam1, exam2, exam3）
    const isExamMode = ['exam1', 'exam2', 'exam3'].includes(mode);

    // 模擬試験モードの場合はホームに戻るリンクを非表示
    if (isExamMode) {
        $('#exam-back-link').hide();
    }

    // =====================================
    // タイマー機能
    // =====================================

    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function updateTimerDisplay() {
        const $timer = $('#timer-display');
        $('#timer-text').text(formatTime(state.remainingTime));

        // 残り時間に応じて色を変更
        $timer.removeClass('warning danger');
        if (state.remainingTime <= 300) { // 5分以下
            $timer.addClass('danger');
        } else if (state.remainingTime <= 600) { // 10分以下
            $timer.addClass('warning');
        }
    }

    function startTimer() {
        updateTimerDisplay();
        state.timerInterval = setInterval(function () {
            state.remainingTime--;
            updateTimerDisplay();

            if (state.remainingTime <= 0) {
                clearInterval(state.timerInterval);
                alert('制限時間になりました。採点を行います。');
                showResults();
            }
        }, 1000);
    }

    function stopTimer() {
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
        }
    }

    // =====================================
    // 初期化：モードに応じて試験開始
    // =====================================

    // =====================================
    // 初期化：モードに応じて試験開始
    // =====================================

    // ローディング表示
    const $loading = $('<div id="app-loading" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.8);z-index:9999;display:flex;justify-content:center;align-items:center;font-size:1.5rem;font-weight:bold;color:var(--primary-color);">Loading...</div>');
    $('body').append($loading);

    let questions = [];

    // データ取得と初期化
    (async function init() {
        try {
            if (['exam1', 'exam2', 'exam3'].includes(mode)) {
                // 試験IDから数字部分を抽出 (exam1 -> "1")
                const examId = mode.replace('exam', '');
                questions = await DB.fetchQuestionsByExamId(examId);

                if (questions.length === 0) {
                    throw new Error('No questions found');
                }

                let title = `模擬試験 ${examId}`;
                startExam(mode, title, questions);

            } else if (mode === 'random') {
                // 全問題からランダムに50問
                const allQuestions = await DB.fetchAllQuestions();
                questions = formatQuestionsAndShuffle(allQuestions, 50);
                startRandomExam(questions);

            } else if (mode === 'single') {
                // 全問題からランダム（一問一答） - 件数制限なし
                const allQuestions = await DB.fetchAllQuestions();
                questions = formatQuestionsAndShuffle(allQuestions, null);
                startSingleMode(questions);

            } else if (mode === 'review') {
                // 復習モード（過去の結果を表示）
                const resultId = urlParams.get('id');
                if (!resultId) throw new Error('Result ID not specified');

                const resultDetails = await DB.fetchExamResultDetails(resultId);
                if (!resultDetails) throw new Error('Review data not found');

                startReviewMode(resultDetails);
            }

        } catch (error) {
            console.error('Initialization error:', error);
            alert(`データの読み込みに失敗しました。\nエラー詳細: ${error.message || error}`);
            // window.location.href = 'index.html'; // デバッグ用にリダイレクトを一時停止
        } finally {
            $loading.remove();
        }
    })();

    // データを整形・シャッフル（limitがnullなら全件）
    function formatQuestionsAndShuffle(allQuestions, limit) {
        // App用フォーマットに変換
        const formatted = DB.formatQuestions(allQuestions);

        // シャッフル
        for (let i = formatted.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [formatted[i], formatted[j]] = [formatted[j], formatted[i]];
        }

        // 指定があれば件数を制限、なければ全件
        const result = limit ? formatted.slice(0, limit) : formatted;

        // IDを振り直す
        return result.map((q, idx) => ({
            ...q,
            id: idx + 1
        }));
    }

    // =====================================
    // 試験開始処理
    // =====================================

    function startExam(examKey, examTitle, questionData) {
        state.currentExam = examKey;
        state.currentMode = 'exam';
        state.currentQuestionIndex = 0;
        state.questions = questionData;
        state.answers = {};
        state.flags = {};

        $('#exam-title').text(examTitle);
        $('#total-questions').text(state.questions.length);

        renderQuestionNumbers();
        showQuestion(0);
        showScreen('exam-screen');
        startTimer();
    }

    function startRandomExam(questionData) {
        state.currentExam = 'random';
        state.currentMode = 'exam';
        state.currentQuestionIndex = 0;
        state.questions = questionData;
        state.answers = {};
        state.flags = {};

        $('#exam-title').text('ランダム出題');
        $('#total-questions').text(state.questions.length);

        renderQuestionNumbers();
        showQuestion(0);
        showScreen('exam-screen');
        startTimer();
    }

    function startSingleMode(questionData) {
        state.currentExam = 'single';
        state.currentMode = 'single';
        state.currentQuestionIndex = 0;
        state.questions = questionData;
        state.answers = {};

        $('#single-total').text(state.questions.length);

        showSingleQuestion(0);
        showScreen('single-screen');
    }

    function startReviewMode(data) {
        state.currentExam = data.result.exam_mode;
        state.currentMode = 'review'; // 復習モード
        state.questions = data.questions;
        state.answers = {};

        // 回答データを復元
        state.questions.forEach((q, idx) => {
            if (q.userAnswer !== null) {
                state.answers[idx] = q.userAnswer;
            }
        });

        $('#exam-title').text(`復習: ${data.result.created_at.slice(0, 10)} 実施分`);
        $('#total-questions').text(state.questions.length);

        // 結果画面を直接表示するための計算
        let correct = 0;
        let incorrect = 0;
        state.questions.forEach((q) => {
            // isCorrectプロパティがDBから取得されているのでそれを使用
            if (q.isCorrect) correct++;
            else incorrect++;
        });

        // 状態をセットしたら直接結果画面へ遷移
        const percentage = data.result.correct_rate; // DB保存値を使用

        let examName = '模擬試験';
        if (state.currentExam === 'exam1') examName = '模擬試験 1';
        else if (state.currentExam === 'exam2') examName = '模擬試験 2';
        else if (state.currentExam === 'exam3') examName = '模擬試験 3';
        else if (state.currentExam === 'random') examName = 'ランダム出題';
        else if (state.currentExam === 'single') examName = '1問1答';

        $('#result-exam-name').text(examName);
        $('#correct-count').text(correct);
        $('#incorrect-count').text(incorrect);
        $('#percentage').text(percentage);

        renderChart(correct, incorrect);
        renderDetailsList();

        showScreen('result-screen');
    }



    // =====================================
    // 問題番号ボタン描画
    // =====================================

    function renderQuestionNumbers() {
        const $container = $('#question-numbers');
        $container.empty();

        state.questions.forEach((q, idx) => {
            const $btn = $('<button>')
                .addClass('q-num-btn')
                .text(idx + 1)
                .data('index', idx);

            if (idx === state.currentQuestionIndex) {
                $btn.addClass('active');
            }

            $container.append($btn);
        });
    }

    function updateQuestionNumbers() {
        $('.q-num-btn').each(function () {
            const idx = $(this).data('index');
            $(this).removeClass('active answered flagged');

            if (idx === state.currentQuestionIndex) {
                $(this).addClass('active');
            }
            if (state.answers[idx] !== undefined) {
                $(this).addClass('answered');
            }
            if (state.flags[idx]) {
                $(this).addClass('flagged');
            }
        });
    }

    $('#question-numbers').on('click', '.q-num-btn', function () {
        const idx = $(this).data('index');
        showQuestion(idx);
    });

    // =====================================
    // 問題表示（試験モード）
    // =====================================

    function showQuestion(index) {
        // 画面上部へスクロール（モバイル対策）
        window.scrollTo(0, 0);

        state.currentQuestionIndex = index;
        const question = state.questions[index];

        $('#current-question-num').text(index + 1);
        $('#question-badge').text(`Q.${index + 1}`);
        $('#question-text').text(question.question);

        // 画像の表示制御
        if (question.image) {
            $('#question-image').attr('src', question.image);
            $('#question-image-container').show();
        } else {
            $('#question-image-container').hide();
        }

        if (question.category) {
            $('#question-category').text(question.category).show();
        } else {
            $('#question-category').hide();
        }

        const $choices = $('#choices-container');
        $choices.empty();

        question.choices.forEach((choice, i) => {
            const isSelected = state.answers[index] === i;
            const $item = $(`
                <label class="choice-item ${isSelected ? 'selected' : ''}">
                    <input type="radio" name="answer" value="${i}" ${isSelected ? 'checked' : ''}>
                    <span class="choice-label">${choiceLabels[i]}</span>
                    <span class="choice-text">${choice}</span>
                </label>
            `);
            $choices.append($item);
        });

        if (state.flags[index]) {
            $('#flag-btn').addClass('active');
            $('#flag-btn .flag-text').text('フラグを外す');
        } else {
            $('#flag-btn').removeClass('active');
            $('#flag-btn .flag-text').text('フラグを付ける');
        }

        // ナビゲーションボタンの表示制御
        if (index === 0) {
            $('#prev-btn').css('visibility', 'hidden');
        } else {
            $('#prev-btn').css('visibility', 'visible');
        }

        if (index === state.questions.length - 1) {
            $('#next-btn').css('visibility', 'hidden');
        } else {
            $('#next-btn').css('visibility', 'visible');
        }

        updateQuestionNumbers();
    }

    $('#choices-container').on('click', '.choice-item', function () {
        const value = parseInt($(this).find('input').val());
        state.answers[state.currentQuestionIndex] = value;

        $('.choice-item').removeClass('selected');
        $(this).addClass('selected');

        updateQuestionNumbers();
    });

    $('#flag-btn').on('click', function () {
        const idx = state.currentQuestionIndex;
        state.flags[idx] = !state.flags[idx];

        if (state.flags[idx]) {
            $(this).addClass('active');
            $(this).find('.flag-icon i').removeClass('fa-regular').addClass('fa-solid'); // Solid icon
            $(this).find('.flag-text').text('フラグを外す');
        } else {
            $(this).removeClass('active');
            $(this).find('.flag-icon i').removeClass('fa-solid').addClass('fa-regular'); // Regular icon
            $(this).find('.flag-text').text('フラグを付ける');
        }

        updateQuestionNumbers();
    });

    $('#prev-btn').on('click', function () {
        if (state.currentQuestionIndex > 0) {
            showQuestion(state.currentQuestionIndex - 1);
        }
    });

    $('#next-btn').on('click', function () {
        if (state.currentQuestionIndex < state.questions.length - 1) {
            showQuestion(state.currentQuestionIndex + 1);
        }
    });

    // =====================================
    // 1問1答モード
    // =====================================

    function showSingleQuestion(index) {
        state.currentQuestionIndex = index;
        const question = state.questions[index];

        $('#single-current').text(index + 1);
        $('#single-badge').text(`Q.${index + 1}`);
        $('#single-question-text').text(question.question);

        // 画像の表示制御
        if (question.image) {
            $('#single-question-image').attr('src', question.image);
            $('#single-question-image-container').show();
        } else {
            $('#single-question-image-container').hide();
        }

        const $choices = $('#single-choices');
        $choices.empty();

        question.choices.forEach((choice, i) => {
            const $item = $(`
                <label class="choice-item">
                    <input type="radio" name="single-answer" value="${i}">
                    <span class="choice-label">${choiceLabels[i]}</span>
                    <span class="choice-text">${choice}</span>
                </label>
            `);
            $choices.append($item);
        });

        $('#single-answer-area').hide();
        $('#show-answer-btn').show();
        $('#next-single-btn').hide();
    }

    $('#single-choices').on('click', '.choice-item', function () {
        const value = parseInt($(this).find('input').val());
        state.answers[state.currentQuestionIndex] = value;

        $('#single-choices .choice-item').removeClass('selected');
        $(this).addClass('selected');
    });

    $('#show-answer-btn').on('click', function () {
        const idx = state.currentQuestionIndex;
        const question = state.questions[idx];
        const userAnswer = state.answers[idx];
        const isCorrect = userAnswer === question.correct;

        const $result = $('#single-result');
        if (isCorrect) {
            $result.html('<i class="fa-solid fa-circle-check"></i> 正解！').removeClass('incorrect').addClass('correct');
        } else {
            $result.html('<i class="fa-solid fa-circle-xmark"></i> 不正解').removeClass('correct').addClass('incorrect');
        }

        $('#single-correct-answer').html(`正解: <strong>${choiceLabels[question.correct]}</strong> - ${question.choices[question.correct]}`);

        $('#single-choices .choice-item').each(function () {
            const val = parseInt($(this).find('input').val());
            if (val === question.correct) {
                $(this).css('border-color', '#00c853').css('background', 'rgba(0, 200, 83, 0.2)');
            } else if (val === userAnswer && !isCorrect) {
                $(this).css('border-color', '#d50000').css('background', 'rgba(213, 0, 0, 0.2)');
            }
        });

        $('#single-answer-area').show();
        $(this).hide();
        $('#next-single-btn').show();
    });

    $('#next-single-btn').on('click', function () {
        if (state.currentQuestionIndex < state.questions.length - 1) {
            showSingleQuestion(state.currentQuestionIndex + 1);
        } else {
            alert('全ての問題が完了しました！');
            window.location.href = 'index.html';
        }
    });

    // =====================================
    // 採点確認ポップアップ
    // =====================================

    $('#submit-exam').on('click', function () {
        const unanswered = state.questions.length - Object.keys(state.answers).length;

        let message = '採点を行うと、試験が終了します。';
        if (unanswered > 0) {
            message = `未回答の問題が${unanswered}問あります。<br>採点を行うと、試験が終了します。`;
        }

        $('#confirm-message').html(message);
        $('#confirm-modal').addClass('active');
    });

    $('#confirm-cancel').on('click', function () {
        $('#confirm-modal').removeClass('active');
    });

    $('#confirm-submit').on('click', function () {
        $('#confirm-modal').removeClass('active');
        stopTimer();
        showResults();
    });

    $('#confirm-modal').on('click', function (e) {
        if ($(e.target).is('#confirm-modal')) {
            $(this).removeClass('active');
        }
    });

    // =====================================
    // 結果表示
    // =====================================

    function showResults() {
        // 画面上部へスクロール
        window.scrollTo(0, 0);

        let correct = 0;
        let incorrect = 0;

        state.questions.forEach((question, idx) => {
            const userAnswer = state.answers[idx];
            if (userAnswer === question.correct) {
                correct++;
            } else {
                incorrect++;
            }
        });

        const percentage = Math.round((correct / state.questions.length) * 100);

        let examName = '模擬試験';
        if (state.currentExam === 'exam1') examName = '模擬試験 1';
        else if (state.currentExam === 'exam2') examName = '模擬試験 2';
        else if (state.currentExam === 'exam3') examName = '模擬試験 3';
        else if (state.currentExam === 'random') examName = 'ランダム出題';
        else if (state.currentExam === 'single') examName = '1問1答';

        // ログイン済みなら結果を保存
        Auth.getCurrentUser().then(user => {
            if (user) {
                // 詳細データの作成
                const details = state.questions.map((q, idx) => {
                    const userAnswer = state.answers[idx];
                    const isCorrect = userAnswer === q.correct;
                    return {
                        id: q.db_id || q.id, // DB上のIDを使用（なければ表示ID）
                        userAnswer: userAnswer !== undefined ? userAnswer : null,
                        isCorrect: isCorrect
                    };
                });

                DB.saveExamResult(
                    user.id,
                    state.currentExam,
                    correct,
                    state.questions.length,
                    percentage,
                    details
                );
            }
        });

        $('#result-exam-name').text(examName);
        $('#correct-count').text(correct);
        $('#incorrect-count').text(incorrect);
        $('#percentage').text(percentage);

        renderChart(correct, incorrect);
        renderDetailsList();

        showScreen('result-screen');
    }

    function renderChart(correct, incorrect) {
        const ctx = document.getElementById('result-chart').getContext('2d');

        if (state.chart) {
            state.chart.destroy();
        }

        state.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['正解', '不正解'],
                datasets: [{
                    data: [correct, incorrect],
                    backgroundColor: ['#00c853', '#d50000'],
                    borderColor: ['#69f0ae', '#ff5252'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#1a2332',
                            font: { size: 14, weight: 500 },
                            padding: 20
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }

    function renderDetailsList() {
        const $list = $('#result-details-list');
        $list.empty();

        state.questions.forEach((question, idx) => {
            const userAnswer = state.answers[idx];
            const isCorrect = userAnswer === question.correct;

            const $item = $('<button>')
                .addClass('detail-item')
                .addClass(isCorrect ? 'correct' : 'incorrect')
                .text(idx + 1)
                .data('index', idx);

            $list.append($item);
        });
    }

    $('#result-details-list').on('click', '.detail-item', function () {
        const idx = $(this).data('index');
        const question = state.questions[idx];
        const userAnswer = state.answers[idx];

        $('#modal-title').text(`Q.${idx + 1}`);
        if (question.category) {
            $('#modal-category').text(question.category).show();
        } else {
            $('#modal-category').hide();
        }
        $('#modal-question').text(question.question);

        // 画像の表示制御
        if (question.image) {
            $('#modal-image').attr('src', question.image);
            $('#modal-image-container').show();
        } else {
            $('#modal-image-container').hide();
        }

        const $choices = $('#modal-choices');
        $choices.empty();

        question.choices.forEach((choice, i) => {
            const isCorrect = i === question.correct;
            const isYourAnswer = i === userAnswer;

            let classes = 'modal-choice';
            if (isCorrect) classes += ' correct';
            if (isYourAnswer && !isCorrect) classes += ' incorrect';
            if (isYourAnswer) classes += ' your-answer';

            const $item = $(`
                <div class="${classes}">
                    <span class="modal-choice-label">${choiceLabels[i]}</span>
                    <span>${choice}</span>
                </div>
            `);
            $choices.append($item);
        });

        $('#modal-your-answer').text(userAnswer !== undefined ? choiceLabels[userAnswer] : '未回答');
        $('#modal-correct-answer').text(choiceLabels[question.correct]);

        // 結果アイコンの更新
        const $icon = $('#modal-result-icon');
        const isCorrect = userAnswer === question.correct;

        if (isCorrect) {
            $icon.html('<i class="fa-solid fa-circle-check"></i>').removeClass('incorrect').addClass('correct');
        } else {
            $icon.html('<i class="fa-solid fa-circle-xmark"></i>').removeClass('correct').addClass('incorrect');
        }

        $('#question-modal').addClass('active');
    });

    $('#modal-close').on('click', function () {
        $('#question-modal').removeClass('active');
    });

    $('#question-modal').on('click', function (e) {
        if ($(e.target).is('#question-modal')) {
            $(this).removeClass('active');
        }
    });

    // =====================================
    // Excel出力機能
    // =====================================

    $('#download-excel-btn').on('click', function () {
        // データ作成
        const examTitle = $('#result-exam-name').text();
        const correctCount = $('#correct-count').text();
        const incorrectCount = $('#incorrect-count').text();
        const percentage = $('#percentage').text();

        // サマリーシートデータ
        const summaryData = [
            ['項目', '内容'],
            ['試験名', examTitle],
            ['実施日時', new Date().toLocaleString()],
            ['正解数', correctCount],
            ['不正解数', incorrectCount],
            ['正解率', percentage + '%']
        ];

        // 詳細シートデータ
        const headers = ['No.', '問題', '選択肢1', '選択肢2', '選択肢3', '選択肢4', '正解', 'あなたの回答', '結果'];
        const detailsData = [headers];

        state.questions.forEach((q, i) => {
            const userAnswerIndex = state.answers[i];
            const userAnswer = userAnswerIndex !== undefined ? choiceLabels[userAnswerIndex] : '未回答';
            const correctAnswer = choiceLabels[q.correct];
            const result = userAnswerIndex === q.correct ? '正解' : '不正解';

            const row = [
                i + 1,
                q.question,
                q.choices[0],
                q.choices[1],
                q.choices[2],
                q.choices[3],
                correctAnswer,
                userAnswer,
                result
            ];
            detailsData.push(row);
        });

        // ワークブック作成
        const wb = XLSX.utils.book_new();

        // シート追加
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);

        XLSX.utils.book_append_sheet(wb, wsSummary, "サマリー");
        XLSX.utils.book_append_sheet(wb, wsDetails, "回答詳細");

        // ファイル書き出し
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        let fileName = `模擬試験_結果_${dateStr}.xlsx`;

        if (state.currentExam === 'exam1') fileName = `模擬試験1_${dateStr}.xlsx`;
        else if (state.currentExam === 'exam2') fileName = `模擬試験2_${dateStr}.xlsx`;
        else if (state.currentExam === 'exam3') fileName = `模擬試験3_${dateStr}.xlsx`;
        else if (state.currentExam === 'random') fileName = `ランダム出題_${dateStr}.xlsx`;
        else if (state.currentExam === 'single') fileName = `1問1答_${dateStr}.xlsx`;

        XLSX.writeFile(wb, fileName);
    });

    // =====================================
    // 画像拡大機能
    // =====================================

    // 画像クリックでモーダル表示（動的要素対応）
    $(document).on('click', '.question-image-container img', function () {
        const src = $(this).attr('src');
        $('#zoomed-image').attr('src', src);
        $('#image-zoom-modal').addClass('active');
    });

    // 閉じるボタンクリックで非表示
    $('.zoom-close').on('click', function () {
        $('#image-zoom-modal').removeClass('active');
    });

    // モーダル背景クリックで非表示
    $('#image-zoom-modal').on('click', function (e) {
        if ($(e.target).is('#image-zoom-modal')) {
            $(this).removeClass('active');
        }
    });

    // ESCキーで非表示
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $('#image-zoom-modal').hasClass('active')) {
            $('#image-zoom-modal').removeClass('active');
        }
    });
});
