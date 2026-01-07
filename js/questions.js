// 模擬試験データ（3つの試験、各50問）
const examData = {
    exam1: [],
    exam2: [],
    exam3: []
};

// サンプル問題を生成（実際の問題に置き換え可能）
const topics = [
    {
        category: "基本情報", questions: [
            { q: "下図のアーキテクチャ構成において、緑色の「WEB SERVER」の主な役割として適切なものはどれか", c: ["ユーザーからのリクエストを処理する", "データを永続保存する", "負荷分散のみを行う", "ネットワーク接続を提供する"], a: 0, image: "images/sample_question.png" },
            { q: "1バイトは何ビットか", c: ["4ビット", "8ビット", "16ビット", "32ビット"], a: 1 },
            { q: "OSの役割として最も適切なものはどれか", c: ["文書作成", "ハードウェアとソフトウェアの仲介", "ウイルス対策", "データ圧縮"], a: 1 },
            { q: "RAMの特徴として正しいものはどれか", c: ["電源を切ってもデータが消えない", "読み取り専用", "揮発性メモリ", "磁気記憶装置"], a: 2 },
            { q: "HDDとSSDの違いとして正しいものはどれか", c: ["HDDの方が高速", "SSDは駆動部品がない", "HDDの方が静か", "SSDは容量が大きい"], a: 1 }
        ]
    },
    {
        category: "ネットワーク", questions: [
            { q: "IPアドレスの役割として正しいものはどれか", c: ["ネットワーク上の機器を識別する", "ファイルを圧縮する", "ウイルスを検出する", "画面を表示する"], a: 0 },
            { q: "HTTPSの's'が意味するものは何か", c: ["Speed", "Secure", "Simple", "Standard"], a: 1 },
            { q: "DNSの役割として正しいものはどれか", c: ["ファイル転送", "ドメイン名とIPアドレスの変換", "メール送信", "データ暗号化"], a: 1 },
            { q: "ファイアウォールの主な目的は何か", c: ["ファイル共有", "不正アクセスの防止", "データバックアップ", "プリンタ接続"], a: 1 },
            { q: "Wi-Fiの正式名称は何か", c: ["Wireless Fidelity", "Wide Fiber", "Window Finder", "定義なし"], a: 3 }
        ]
    },
    {
        category: "プログラミング", questions: [
            { q: "変数の役割として正しいものはどれか", c: ["データを一時的に保存する", "プログラムを実行する", "画面を描画する", "ネットワーク接続する"], a: 0 },
            { q: "条件分岐を行う制御構造はどれか", c: ["for文", "if文", "while文", "function文"], a: 1 },
            { q: "ループ処理を途中で抜けるキーワードはどれか", c: ["continue", "exit", "break", "stop"], a: 2 },
            { q: "配列のインデックスは通常何から始まるか", c: ["0", "1", "-1", "10"], a: 0 },
            { q: "関数の戻り値を返すキーワードはどれか", c: ["output", "return", "result", "give"], a: 1 }
        ]
    },
    {
        category: "データベース", questions: [
            { q: "SQLでデータを取得するコマンドはどれか", c: ["INSERT", "UPDATE", "SELECT", "DELETE"], a: 2 },
            { q: "主キーの特徴として正しいものはどれか", c: ["重複可能", "NULL許可", "一意に識別できる", "外部参照のみ"], a: 2 },
            { q: "データベースの正規化の目的は何か", c: ["処理速度向上", "データの重複排除", "セキュリティ強化", "容量削減"], a: 1 },
            { q: "外部キーの役割は何か", c: ["主キーの複製", "テーブル間の関連付け", "データの暗号化", "インデックス作成"], a: 1 },
            { q: "トランザクションの特性ACIDのAは何を意味するか", c: ["Atomicity", "Accuracy", "Availability", "Authentication"], a: 0 }
        ]
    },
    {
        category: "セキュリティ", questions: [
            { q: "パスワードの安全な管理方法はどれか", c: ["付箋に書いてモニターに貼る", "複雑なパスワードを使い回す", "パスワードマネージャーを使用", "簡単な単語を使う"], a: 2 },
            { q: "フィッシング詐欺の特徴として正しいものはどれか", c: ["正規サイトを装う", "ウイルス感染", "DoS攻撃", "ブルートフォース"], a: 0 },
            { q: "二要素認証の例として正しいものはどれか", c: ["パスワードのみ", "パスワード+SMS認証", "ユーザー名のみ", "メールアドレスのみ"], a: 1 },
            { q: "暗号化の目的は何か", c: ["データ圧縮", "高速化", "機密性の確保", "可用性の向上"], a: 2 },
            { q: "公開鍵暗号方式の特徴はどれか", c: ["暗号化と復号に同じ鍵", "暗号化と復号に異なる鍵", "鍵が不要", "ハッシュ関数を使用"], a: 1 }
        ]
    },
    {
        category: "システム開発", questions: [
            { q: "ウォーターフォール開発の特徴はどれか", c: ["反復的な開発", "工程を順次進める", "並列開発", "プロトタイプ重視"], a: 1 },
            { q: "アジャイル開発の特徴はどれか", c: ["長期計画重視", "柔軟で反復的", "文書化重視", "大規模向け"], a: 1 },
            { q: "単体テストの対象は何か", c: ["システム全体", "複数モジュール", "個々のモジュール", "ユーザー操作"], a: 2 },
            { q: "バグの修正後に行うべきテストは何か", c: ["単体テスト", "結合テスト", "回帰テスト", "性能テスト"], a: 2 },
            { q: "コードレビューの目的として正しいものはどれか", c: ["開発者の評価", "品質向上", "開発時間短縮", "コスト削減"], a: 1 }
        ]
    },
    {
        category: "アルゴリズム", questions: [
            { q: "線形探索の計算量は何か", c: ["O(1)", "O(log n)", "O(n)", "O(n²)"], a: 2 },
            { q: "バイナリサーチの前提条件は何か", c: ["データが未整列", "データが整列済み", "データがランダム", "データが重複"], a: 1 },
            { q: "スタックのデータ構造の特徴は何か", c: ["FIFO", "LIFO", "ランダムアクセス", "双方向リスト"], a: 1 },
            { q: "キューのデータ構造の特徴は何か", c: ["FIFO", "LIFO", "ランダムアクセス", "スタック"], a: 0 },
            { q: "再帰関数の特徴は何か", c: ["ループを使用", "自分自身を呼び出す", "戻り値なし", "引数なし"], a: 1 }
        ]
    },
    {
        category: "ハードウェア", questions: [
            { q: "GPUの主な用途は何か", c: ["音声処理", "グラフィック処理", "ネットワーク処理", "文書作成"], a: 1 },
            { q: "マザーボードの役割は何か", c: ["データ保存", "各部品の接続", "表示出力", "電源供給"], a: 1 },
            { q: "SATAとは何か", c: ["ネットワーク規格", "ストレージ接続規格", "無線規格", "セキュリティ規格"], a: 1 },
            { q: "冷却ファンの目的は何か", c: ["ノイズ発生", "熱を逃がす", "電力供給", "データ転送"], a: 1 },
            { q: "電源ユニットの役割は何か", c: ["データ処理", "電力変換と供給", "画面表示", "音声出力"], a: 1 }
        ]
    },
    {
        category: "クラウド", questions: [
            { q: "IaaSとは何か", c: ["ソフトウェア提供", "プラットフォーム提供", "インフラ提供", "データ提供"], a: 2 },
            { q: "SaaSの例として正しいものは何か", c: ["AWS EC2", "Google Workspace", "Docker", "Linux"], a: 1 },
            { q: "クラウドのメリットとして正しいものは何か", c: ["初期費用が高い", "スケーラビリティ", "セキュリティリスクなし", "オフライン専用"], a: 1 },
            { q: "オンプレミスとは何か", c: ["クラウド環境", "自社設備でのシステム運用", "仮想化", "コンテナ技術"], a: 1 },
            { q: "マルチクラウドのメリットは何か", c: ["コスト増加", "ベンダーロックイン回避", "複雑性低下", "セキュリティ低下"], a: 1 }
        ]
    },
    {
        category: "Web技術", questions: [
            { q: "HTMLの役割は何か", c: ["スタイル定義", "構造定義", "動作定義", "データ保存"], a: 1 },
            { q: "CSSの役割は何か", c: ["構造定義", "スタイル定義", "動作定義", "通信処理"], a: 1 },
            { q: "JavaScriptの役割は何か", c: ["構造定義", "スタイル定義", "動的な動作の実装", "データベース操作"], a: 2 },
            { q: "レスポンシブデザインとは何か", c: ["高速表示", "画面サイズに応じた表示調整", "アニメーション", "SEO対策"], a: 1 },
            { q: "APIとは何か", c: ["プログラミング言語", "ソフトウェア間の接続仕様", "データベース", "フレームワーク"], a: 1 }
        ]
    }
];

// 問題を生成
function generateQuestions() {
    let id = 1;

    // 試験1用の問題
    for (let i = 0; i < 50; i++) {
        const topicIndex = i % topics.length;
        const questionIndex = Math.floor(i / topics.length) % topics[topicIndex].questions.length;
        const q = topics[topicIndex].questions[questionIndex];

        examData.exam1.push({
            id: id++,
            category: topics[topicIndex].category,
            question: `【${topics[topicIndex].category}】${q.q}`,
            choices: [...q.c],
            correct: q.a,
            image: q.image
        });
    }

    // 試験2用の問題（選択肢をシャッフル）
    id = 1;
    for (let i = 0; i < 50; i++) {
        const topicIndex = (i + 2) % topics.length;
        const questionIndex = (Math.floor(i / topics.length) + 1) % topics[topicIndex].questions.length;
        const q = topics[topicIndex].questions[questionIndex];

        const shuffledChoices = [...q.c];
        const correctAnswer = shuffledChoices[q.a];
        shuffledChoices.sort(() => Math.random() - 0.5);
        const newCorrectIndex = shuffledChoices.indexOf(correctAnswer);

        examData.exam2.push({
            id: id++,
            category: topics[topicIndex].category,
            question: `【${topics[topicIndex].category}】${q.q}`,
            choices: shuffledChoices,
            correct: newCorrectIndex,
            image: q.image
        });
    }

    // 試験3用の問題（別の組み合わせ）
    id = 1;
    for (let i = 0; i < 50; i++) {
        const topicIndex = (i + 5) % topics.length;
        const questionIndex = (Math.floor(i / topics.length) + 2) % topics[topicIndex].questions.length;
        const q = topics[topicIndex].questions[questionIndex];

        const shuffledChoices = [...q.c];
        const correctAnswer = shuffledChoices[q.a];
        shuffledChoices.sort(() => Math.random() - 0.5);
        const newCorrectIndex = shuffledChoices.indexOf(correctAnswer);

        examData.exam3.push({
            id: id++,
            category: topics[topicIndex].category,
            question: `【${topics[topicIndex].category}】${q.q}`,
            choices: shuffledChoices,
            correct: newCorrectIndex,
            image: q.image
        });
    }
}

// 問題生成を実行
generateQuestions();
