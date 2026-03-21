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

  // メッセージをアラートで表示する関数
  const displayMessage = (message) => {
    alert(message);
  };

  // バリデーションエラーの詳細をアラートで表示する共通関数
  const handleValidationError = (data) => {
    const errorMessages = data.detail.map((err) => `・${err.loc.join(" → ")}: ${err.msg}`).join("\n");
    displayMessage(`入力内容にエラーがあります。\n${errorMessages}`);
  };

  // 新しいメモを作成するための非同期関数
  // APIにPOSTリクエストを送信し、成功した場合はメッセージを表示し、フォームをリセットする
  const createMemo = async () => {
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
    fetchAndDisplayMemos();
  };

  // 既存のメモを更新するための非同期関数
  // APIにPUTリクエストを送信し、成功した場合はメッセージを表示し、フォームをリセットする
  const updateMemo = async () => {
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
      displayMessage(`更新に失敗しました。（ステータスコード: ${response.status}）`);
      return;
    }

    displayMessage("メモの更新に成功しました。");
    resetForm();
    fetchAndDisplayMemos();
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
      displayMessage(`削除に失敗しました。（ステータスコード: ${response.status}）`);
      return;
    }

    displayMessage(data.message);
    fetchAndDisplayMemos();
  };

  // 特定のメモを編集モードに設定するための非同期関数
  // メモのデータをフォームに表示し、編集モードに切り替える
  const editMemo = async (memoId) => {
    const response = await fetch(`${apiUrl}/${memoId}`);

    if (!response.ok) {
      displayMessage(`メモの取得に失敗しました。（ステータスコード: ${response.status}）`);
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
  };

  // サーバーからメモ一覧を取得し、テーブルに表示する非同期関数
  const fetchAndDisplayMemos = async (order = sortOrder) => {
    const response = await fetch(`${apiUrl}?order=${order}`);

    // 失敗した場合、失敗した内容のメッセージを表示する
    if (!response.ok) {
      displayMessage(`メモ一覧の取得に失敗しました。（ステータスコード: ${response.status}）`);
      return;
    }

    // 取得したメモ一覧をstateに保存し、テーブルを再レンダリングする
    const data = await response.json();
    setMemos(data);
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "desc" ? "asc" : "desc";
    setSortOrder(newOrder);
    fetchAndDisplayMemos(newOrder);
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
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">説明</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="説明を入力してください（任意）"
          />
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
          <div className="list-header-actions">
            <button className="btn btn-secondary" onClick={toggleSortOrder}>
              作成日時：{sortOrder === "desc" ? "新しい順" : "古い順"}
            </button>
            <button className="btn btn-secondary" onClick={() => fetchAndDisplayMemos()}>一覧を更新</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>タイトル</th>
              <th>説明</th>
              <th>作成日時</th>
              <th>更新日時</th>
              <th>編集</th>
              <th>削除</th>
            </tr>
          </thead>
          <tbody>
            {memos.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-message">メモがありません</td>
              </tr>
            ) : (
              memos.map((memo) => (
                <tr key={memo.memo_id}>
                  <td>{memo.title}</td>
                  <td>{memo.description}</td>
                  <td>{new Date(memo.created_at).toLocaleString("ja-JP")}</td>
                  <td>{memo.updated_at ? new Date(memo.updated_at).toLocaleString("ja-JP") : "ー"}</td>
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
      </section>
    </div>
  );
}
