import { useState, useEffect } from "react";

const apiUrl = "http://localhost:8000/memos/all";

// Authorizationヘッダーを作るヘルパー関数
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

// 管理者画面
// 全ユーザーのメモを閲覧できるが、編集・削除ボタンは表示しない
export default function AdminPage({ onLogout }) {
  const [memos, setMemos] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState({ message: "", type: "success", show: false });
  const PER_PAGE = 10;

  const displayMessage = (message, type = "success") => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // 401が返ってきた場合はトークン切れとみなしてログアウトする
  const handleUnauthorized = (response) => {
    if (response.status === 401) {
      localStorage.removeItem("access_token");
      onLogout();
      return true;
    }
    return false;
  };

  const fetchAllMemos = async (order = sortOrder, targetPage = page) => {
    const response = await fetch(
      `${apiUrl}?order=${order}&page=${targetPage}&per_page=${PER_PAGE}`,
      { headers: authHeaders() }
    );

    if (handleUnauthorized(response)) return;
    if (!response.ok) {
      displayMessage("メモ一覧の取得に失敗しました", "error");
      return;
    }

    const data = await response.json();
    setMemos(data.items);
    setTotalPages(data.total_pages);
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "desc" ? "asc" : "desc";
    setSortOrder(newOrder);
    setPage(1);
    fetchAllMemos(newOrder, 1);
  };

  const changePage = (newPage) => {
    setPage(newPage);
    fetchAllMemos(sortOrder, newPage);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    onLogout();
  };

  useEffect(() => {
    fetchAllMemos();
  }, []);

  return (
    <div className="container">
      {/* トースト通知 */}
      <div className={`toast toast-${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.message}
      </div>

      {/* ヘッダー */}
      <div className="app-header">
        <h1>管理者画面</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <a href="/" className="btn btn-secondary">メモ画面へ</a>
          <button className="btn btn-secondary" onClick={logout}>ログアウト</button>
        </div>
      </div>

      {/* 全メモ一覧（編集・削除ボタンなし） */}
      <section className="list-section">
        <div className="list-header">
          <h2>全ユーザーのメモ一覧</h2>
          <button className="btn btn-secondary" onClick={toggleSortOrder}>
            作成日時：{sortOrder === "desc" ? "新しい順" : "古い順"}
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>タイトル</th>
              <th>説明</th>
            </tr>
          </thead>
          <tbody>
            {memos.length === 0 ? (
              <tr>
                <td colSpan="2" className="empty-message">メモがありません</td>
              </tr>
            ) : (
              memos.map((memo) => (
                <tr key={memo.memo_id}>
                  <td>{memo.title}</td>
                  <td>{memo.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ページネーション */}
        <div className="pagination">
          <button className="btn btn-secondary" onClick={() => changePage(1)} disabled={page === 1}>最初へ</button>
          <button className="btn btn-secondary" onClick={() => changePage(page - 1)} disabled={page === 1}>前へ</button>
          <span className="pagination-info">{page} / {totalPages} ページ</span>
          <button className="btn btn-secondary" onClick={() => changePage(page + 1)} disabled={page === totalPages}>次へ</button>
          <button className="btn btn-secondary" onClick={() => changePage(totalPages)} disabled={page === totalPages}>最後へ</button>
        </div>
      </section>
    </div>
  );
}
