const Auth = {
    // Googleでログイン
    async signInWithGoogle() {
        try {
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: window.location.href // 現在のページにリダイレクト
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Login error:', error);
            alert('ログインに失敗しました: ' + error.message);
        }
    },

    // ログアウト
    async signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
            alert('ログアウトに失敗しました');
        }
    },

    // ユーザー状態の監視
    initAuthObserver(onUserChange) {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            const user = session ? session.user : null;
            if (onUserChange) {
                onUserChange(user);
            }
        });
    },

    // 現在のユーザー取得
    async getCurrentUser() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            return user;
        } catch {
            return null;
        }
    }
};
