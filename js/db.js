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
                .eq('exam_id', examId);

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
            db_id: item.Id, // DB上のID
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

    // 試験結果を保存
    async saveExamResult(userId, examMode, score, total, correctRate) {
        try {
            const { error } = await supabaseClient
                .from('ExamResults')
                .insert({
                    user_id: userId,
                    exam_mode: examMode,
                    score: score,
                    total_questions: total,
                    correct_rate: correctRate
                });

            if (error) throw error;
            console.log('Exam result saved successfully');
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
    }
};
