import { useState } from "react";
import AuthPage from "./pages/AuthPage";
import MemoPage from "./pages/MemoPage";
import AdminPage from "./pages/AdminPage";

// アプリのルートコンポーネント
// localStorageのトークンの有無でどの画面を表示するかを管理する
export default function App() {
  // 初期値はlocalStorageから取得する（ページリロード後もログイン状態を維持するため）
  const [token, setToken] = useState(localStorage.getItem("access_token"));

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    setToken(null);
  };

  // トークンがない場合はログイン・登録画面を表示する（未ログイン時のリダイレクト）
  if (!token) {
    return <AuthPage onLogin={handleLogin} />;
  }

  // /admin パスの場合は管理者画面を表示する
  if (window.location.pathname === "/admin") {
    return <AdminPage onLogout={handleLogout} />;
  }

  // それ以外はメモ画面を表示する
  return <MemoPage onLogout={handleLogout} />;
}
