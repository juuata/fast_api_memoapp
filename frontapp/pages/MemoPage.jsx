import { useState, useRef, useEffect } from "react";

const API_BASE = "https://memoapp-backend-w2zt.onrender.com";
const apiUrl = `${API_BASE}/memos`;

// localStorageからトークンを取得してAuthorizationヘッダーを作るヘルパー関数
// 全APIリクエストでこのヘッダーを付けることでログイン済みユーザーとして認証される
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

// メモ一覧・CRUD画面
// onLogout() が呼ばれると App.jsx 側でログアウト状態に切り替わる
export default function MemoPage({ onLogout }) {
  const editingMemoId = useRef(null);

  const [formTitle, setFormTitle] = useState("新規メモ登録");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [memos, setMemos] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PER_PAGE = 10;
  const [toast, setToast] = useState({ message: "", type: "success", show: false });

  const displayMessage = (message, type = "success") => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleValidationError = (data) => {
    const errorMessages = data.detail.map((err) => `${err.loc.join(" → ")}: ${err.msg}`).join(" / ");
    displayMessage(`入力エラー: ${errorMessages}`, "error");
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

  const createMemo = async () => {
    if (title.trim() === "") {
      displayMessage("タイトルを入力してください。", "error");
      return;
    }
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ title, description }),
    });

    if (handleUnauthorized(response)) return;
    if (response.status === 422) {
      handleValidationError(await response.json());
      return;
    }

    displayMessage("メモを登録しました。");
    resetForm();
    setPage(1);
    fetchAndDisplayMemos(sortOrder, 1);
  };

  const updateMemo = async () => {
    if (title.trim() === "") {
      displayMessage("タイトルを入力してください。", "error");
      return;
    }
    const response = await fetch(`${apiUrl}/${editingMemoId.current}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ title, description }),
    });

    if (handleUnauthorized(response)) return;
    if (response.status === 422) {
      handleValidationError(await response.json());
      return;
    }
    if (!response.ok) {
      displayMessage(`更新に失敗しました。（ステータスコード: ${response.status}）`, "error");
      return;
    }

    displayMessage("メモの更新に成功しました。");
    resetForm();
    fetchAndDisplayMemos(sortOrder, page);
  };

  const deleteMemo = async (memoId) => {
    if (!window.confirm("本当に削除しますか？")) return;
    const response = await fetch(`${apiUrl}/${memoId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (handleUnauthorized(response)) return;
    if (!response.ok) {
      displayMessage(`削除に失敗しました。（ステータスコード: ${response.status}）`, "error");
      return;
    }

    const data = await response.json();
    displayMessage(data.message);
    fetchAndDisplayMemos(sortOrder, page);
  };

  const editMemo = async (memoId) => {
    const response = await fetch(`${apiUrl}/${memoId}`, {
      headers: authHeaders(),
    });

    if (handleUnauthorized(response)) return;
    if (!response.ok) {
      displayMessage(`メモの取得に失敗しました。（ステータスコード: ${response.status}）`, "error");
      return;
    }

    const memo = await response.json();
    setFormTitle("メモ編集");
    setTitle(memo.title);
    setDescription(memo.description);
    editingMemoId.current = memo.memo_id;
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchAndDisplayMemos = async (order = sortOrder, targetPage = page) => {
    const response = await fetch(
      `${apiUrl}?order=${order}&page=${targetPage}&per_page=${PER_PAGE}`,
      { headers: authHeaders() }
    );

    if (handleUnauthorized(response)) return;
    if (!response.ok) {
      displayMessage(`メモ一覧の取得に失敗しました。（ステータスコード: ${response.status}）`, "error");
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
    fetchAndDisplayMemos(newOrder, 1);
  };

  const changePage = (newPage) => {
    setPage(newPage);
    fetchAndDisplayMemos(sortOrder, newPage);
  };

  useEffect(() => {
    fetchAndDisplayMemos();
  }, []);

  const resetForm = () => {
    setFormTitle("新規メモ登録");
    setTitle("");
    setDescription("");
    setIsEditing(false);
    editingMemoId.current = null;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    onLogout();
  };

  return (
    <div className="container">
      {/* トースト通知 */}
      <div className={`toast toast-${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.message}
      </div>

      {/* ヘッダー */}
      <div className="app-header">
        <h1>メモアプリ</h1>
        <button className="btn btn-secondary" onClick={logout}>ログアウト</button>
      </div>

      {/* 入力フォーム */}
      <section className="form-section">
        <h2>{formTitle}</h2>
        <div className="form-group">
          <label htmlFor="title">タイトル</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトルを入力してください"
            maxLength={50}
          />
          <span className="char-count">{title.length} / 50</span>
        </div>
        <div className="form-group">
          <label htmlFor="description">説明</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="説明を入力してください（任意）"
            maxLength={255}
          />
          <span className="char-count">{description.length} / 255</span>
        </div>
        <div className="form-buttons">
          {!isEditing ? (
            <button className="btn btn-primary" onClick={createMemo}>新規登録</button>
          ) : (
            <>
              <button className="btn btn-primary" onClick={updateMemo}>更新実行</button>
              <button className="btn btn-secondary" onClick={resetForm}>キャンセル</button>
            </>
          )}
        </div>
      </section>

      {/* メモ一覧 */}
      <section className="list-section">
        <div className="list-header">
          <h2>メモ一覧</h2>
          <button className="btn btn-secondary" onClick={toggleSortOrder}>
            作成日時：{sortOrder === "desc" ? "新しい順" : "古い順"}
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>タイトル</th>
              <th>説明</th>
              <th>編集</th>
              <th>削除</th>
            </tr>
          </thead>
          <tbody>
            {memos.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-message">メモがありません</td>
              </tr>
            ) : (
              memos.map((memo) => (
                <tr key={memo.memo_id}>
                  <td>{memo.title}</td>
                  <td>{memo.description}</td>
                  <td>
                    <button className="btn btn-edit" onClick={() => editMemo(memo.memo_id)}>編集</button>
                  </td>
                  <td>
                    <button className="btn btn-delete" onClick={() => deleteMemo(memo.memo_id)}>削除</button>
                  </td>
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
