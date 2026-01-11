// Supabaseクライアントの初期化
const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

const DB = {
    // 全問題を取得する
    async fetchAllQuestions() {
        try {
            const { data, error } = await supabaseClient
                .from('ExamQuestions')
                .select('*');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching questions:', error);
            throw error; // エラーを呼び出し元に伝播させる
        }
    },

    // 指定された試験IDの問題を取得する
    async fetchQuestionsByExamId(examId) {
        try {
            const { data, error } = await supabaseClient
                .from('ExamQuestions')
                .select('*')
                .eq('exam_id', examId)
                .order('Id', { ascending: true }); // ID順にソート (大文字"Id"が正しい)

            if (error) throw error;
            return this.formatQuestions(data);

        } catch (error) {
            console.error(`Error fetching exam ${examId}:`, error);
            return [];
        }
    },

    // アプリケーションで使用する形式に変換
    formatQuestions(data) {
        return data.map((item, index) => ({
            id: index + 1, // 表示用ID（連番）
            db_id: item.Id, // DB上のID (大文字"Id")
            category: item.category,
            question: item.question_text,
            choices: [
                item.option1,
                item.option2,
                item.option3,
                item.option4
            ].filter(opt => opt !== null), // null除外（念のため）
            correct: item.correct_answer,
            image: item.image
        }));
    },

    // 試験結果を保存 (詳細も含む)
    async saveExamResult(userId, examMode, score, total, correctRate, details) {
        try {
            // 1. 親テーブル(ExamResults)に保存
            const { data: resultData, error: resultError } = await supabaseClient
                .from('ExamResults')
                .insert({
                    user_id: userId,
                    exam_mode: examMode,
                    score: score,
                    total_questions: total,
                    correct_rate: correctRate
                })
                .select()
                .single();

            if (resultError) throw resultError;

            // 2. 詳細テーブル(ExamResultDetails)に保存
            if (details && details.length > 0) {
                const resultId = resultData.id;
                const detailsToInsert = details.map(d => ({
                    result_id: resultId,
                    question_id: d.id, // ExamQuestionsのID
                    user_answer: d.userAnswer,
                    is_correct: d.isCorrect
                }));

                const { error: detailsError } = await supabaseClient
                    .from('ExamResultDetails')
                    .insert(detailsToInsert);

                if (detailsError) throw detailsError;
            }

            console.log('Exam result and details saved successfully');
        } catch (error) {
            console.error('Error saving result:', error);
            // ユーザーへのアラートは必須ではない（バックグラウンド保存のため）
        }
    },

    // ユーザーの試験履歴を取得
    async fetchExamResults(userId) {
        try {
            const { data, error } = await supabaseClient
                .from('ExamResults')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching results:', error);
            return [];
        }
    },

    // 指定された結果IDの詳細を取得
    async fetchExamResultDetails(resultId) {
        try {
            // ExamResultsの情報も取得したい場合
            const { data: resultData, error: resultError } = await supabaseClient
                .from('ExamResults')
                .select('*')
                .eq('id', resultId)
                .single();

            if (resultError) throw resultError;

            // 詳細データと、紐づく問題データを取得
            // Note: 本来はjoinすべきだが、Supabase JS clientでのdeep joinは設定が必要な場合があるため
            // まずは詳細を取得し、必要なら問題データも取得する方針。
            // ここでは、単純に詳細 + 問題テキスト等が欲しい。
            // ExamResultDetails -> ExamQuestions のリレーションを利用
            const { data: detailsData, error: detailsError } = await supabaseClient
                .from('ExamResultDetails')
                .select(`
                    *,
                    ExamQuestions (
                        Id, question_text, category, option1, option2, option3, option4, correct_answer, image
                    )
                `)
                .eq('result_id', resultId)
                .order('id', { ascending: true });

            if (detailsError) throw detailsError;

            // アプリで使いやすい形式に変換
            const questions = detailsData.map((item, index) => {
                const q = item.ExamQuestions;
                if (!q) return null; // 問題が削除されている場合など

                return {
                    id: index + 1, // 表示用ID
                    db_id: q.Id,   // 大文字 Id
                    db_question_id: q.Id, // 大文字 Id
                    category: q.category,
                    question: q.question_text,
                    choices: [
                        q.option1, q.option2, q.option3, q.option4
                    ].filter(opt => opt !== null),
                    correct: q.correct_answer,
                    image: q.image,
                    userAnswer: item.user_answer,
                    isCorrect: item.is_correct
                };
            }).filter(item => item !== null);

            return {
                result: resultData,
                questions: questions
            };

        } catch (error) {
            console.error(`Error fetching result details ${resultId}:`, error);
            return null;
        }
    }
};
