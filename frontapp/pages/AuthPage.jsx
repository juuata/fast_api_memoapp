import { useState } from "react";

const API_BASE = "http://13.231.214.36:8000";

// ログイン・ユーザー登録画面
// onLogin(token) が呼ばれると App.jsx 側でログイン状態に切り替わる
export default function AuthPage({ onLogin }) {
  // "login" | "register" でどちらのフォームを表示するか切り替える
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (mode === "login") {
      await login();
    } else {
      await register();
    }
  };

  const login = async () => {
    // ログインはOAuth2の仕様でJSONではなくフォームデータ形式で送る
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!response.ok) {
      setErrorMessage("ユーザー名またはパスワードが正しくありません");
      return;
    }

    const data = await response.json();
    // 取得したトークンをlocalStorageに保存してログイン状態に切り替える
    localStorage.setItem("access_token", data.access_token);
    onLogin(data.access_token);
  };

  const register = async () => {
    const response = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.status === 400) {
      setErrorMessage("このユーザー名はすでに使用されています");
      return;
    }
    if (response.status === 422) {
      setErrorMessage("パスワードは6文字以上で入力してください");
      return;
    }
    if (!response.ok) {
      setErrorMessage("登録に失敗しました");
      return;
    }

    const data = await response.json();
    // 登録後はそのままトークンが返るのでログイン状態に切り替える
    localStorage.setItem("access_token", data.access_token);
    onLogin(data.access_token);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>メモアプリ</h1>

        {/* ログイン・登録タブ切り替え */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setErrorMessage(""); }}
          >
            ログイン
          </button>
          <button
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setErrorMessage(""); }}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">ユーザー名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名を入力"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "6文字以上で入力" : "パスワードを入力"}
              required
            />
          </div>

          {/* エラーメッセージ */}
          {errorMessage && (
            <p className="auth-error">{errorMessage}</p>
          )}

          <button type="submit" className="btn btn-primary auth-submit">
            {mode === "login" ? "ログイン" : "登録する"}
          </button>
        </form>
      </div>
    </div>
  );
}
