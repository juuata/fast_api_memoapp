import { useState, useRef, useEffect } from "react";

// FastAPIのメモエンドポイントのURL
const apiUrl = "http://localhost:8000/memos";

export default function App() {
  // 現在編集中のメモのIDを保持するref（nullの場合は新規登録モード）
  const editingMemoId = useRef(null);

  const [formTitle, setFormTitle] = useState("新規メモ登録");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [memos, setMemos] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  // ページネーション用state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PER_PAGE = 10;
  // トースト通知の状態管理（message: 表示テキスト、type: "success" | "error"、show: 表示フラグ）
  const [toast, setToast] = useState({ message: "", type: "success", show: false });

  // トースト通知を表示する関数（type: "success" | "error"）
  const displayMessage = (message, type = "success") => {
    setToast({ message, type, show: true });
    // 3秒後にトーストを非表示にする
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // バリデーションエラーの詳細をトーストで表示する共通関数
  const handleValidationError = (data) => {
    const errorMessages = data.detail.map((err) => `${err.loc.join(" → ")}: ${err.msg}`).join(" / ");
    displayMessage(`入力エラー: ${errorMessages}`, "error");
  };

  // 新しいメモを作成するための非同期関数
  // APIにPOSTリクエストを送信し、成功した場合はメッセージを表示し、フォームをリセットする
  const createMemo = async () => {
    if (title.trim() === "") {
      displayMessage("タイトルを入力してください。", "error");
      return;
    }
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    const data = await response.json();

    if (response.status === 422) {
      handleValidationError(data);
      return;
    }

    displayMessage("メモを登録しました。");
    resetForm();
    setPage(1);
    fetchAndDisplayMemos(sortOrder, 1);
  };

  // 既存のメモを更新するための非同期関数
  // APIにPUTリクエストを送信し、成功した場合はメッセージを表示し、フォームをリセットする
  const updateMemo = async () => {
    if (title.trim() === "") {
      displayMessage("タイトルを入力してください。", "error");
      return;
    }
    const response = await fetch(`${apiUrl}/${editingMemoId.current}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    const data = await response.json();

    if (response.status === 422) {
      handleValidationError(data);
      return;
    }

    // その他のエラーの場合、失敗した内容のメッセージを表示する
    if (!response.ok) {
      displayMessage(`更新に失敗しました。（ステータスコード: ${response.status}）`, "error");
      return;
    }

    displayMessage("メモの更新に成功しました。");
    resetForm();
    fetchAndDisplayMemos(sortOrder, page);
  };

  // 特定のメモを削除するための非同期関数
  // APIにDELETEリクエストを送信し、成功した場合はメッセージを表示し、メモ一覧を更新する
  const deleteMemo = async (memoId) => {
    if (!window.confirm("本当に削除しますか？")) return;
    const response = await fetch(`${apiUrl}/${memoId}`, {
      method: "DELETE",
    });
    const data = await response.json();

    // その他のエラーの場合、失敗した内容のメッセージを表示する
    if (!response.ok) {
      displayMessage(`削除に失敗しました。（ステータスコード: ${response.status}）`, "error");
      return;
    }

    displayMessage(data.message);
    fetchAndDisplayMemos(sortOrder, page);
  };

  // 特定のメモを編集モードに設定するための非同期関数
  // メモのデータをフォームに表示し、編集モードに切り替える
  const editMemo = async (memoId) => {
    const response = await fetch(`${apiUrl}/${memoId}`);

    if (!response.ok) {
      displayMessage(`メモの取得に失敗しました。（ステータスコード: ${response.status}）`, "error");
      return;
    }

    const memo = await response.json();

    // 取得したメモのデータをフォームに反映する
    setFormTitle("メモ編集");
    setTitle(memo.title);
    setDescription(memo.description);

    // 編集モードに切り替える
    editingMemoId.current = memo.memo_id;
    setIsEditing(true);

    // ページ最上部にスクロールする
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // サーバーからメモ一覧を取得し、テーブルに表示する非同期関数
  const fetchAndDisplayMemos = async (order = sortOrder, targetPage = page) => {
    const response = await fetch(`${apiUrl}?order=${order}&page=${targetPage}&per_page=${PER_PAGE}`);

    // 失敗した場合、失敗した内容のメッセージを表示する
    if (!response.ok) {
      displayMessage(`メモ一覧の取得に失敗しました。（ステータスコード: ${response.status}）`, "error");
      return;
    }

    // 取得したメモ一覧とページ情報をstateに保存する
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

  // ページを変更する関数
  const changePage = (newPage) => {
    setPage(newPage);
    fetchAndDisplayMemos(sortOrder, newPage);
  };

  // ページロード時にメモ一覧を取得する
  useEffect(() => {
    fetchAndDisplayMemos();
  }, []);

  // フォームをリセットし、新規登録モードに戻す関数
  const resetForm = () => {
    // フォームのタイトルをリセット
    setFormTitle("新規メモ登録");
    // タイトル入力欄をリセット
    setTitle("");
    // 詳細入力欄をリセット
    setDescription("");
    // 更新実行ボタンを非表示・新規登録ボタンを再表示
    setIsEditing(false);
    // 編集中のメモIDをリセット
    editingMemoId.current = null;
  };

  return (
    <div className="container">
      {/* トースト通知 */}
      <div className={`toast toast-${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.message}
      </div>

      <h1>メモアプリ</h1>

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
          <button
            className="btn btn-secondary"
            onClick={() => changePage(1)}
            disabled={page === 1}
          >
            最初へ
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => changePage(page - 1)}
            disabled={page === 1}
          >
            前へ
          </button>
          <span className="pagination-info">{page} / {totalPages} ページ</span>
          <button
            className="btn btn-secondary"
            onClick={() => changePage(page + 1)}
            disabled={page === totalPages}
          >
            次へ
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => changePage(totalPages)}
            disabled={page === totalPages}
          >
            最後へ
          </button>
        </div>
      </section>
    </div>
  );
}
