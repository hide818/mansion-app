export default function Home() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-blue-900">
          マンション管理業務アプリ
        </h1>

        <p className="mt-4 text-base text-slate-600">
          物件ごとのタスク、議案メモ、対応履歴を管理するアプリです。
        </p>

        <button className="mt-6 rounded-md bg-blue-900 px-4 py-2 text-white">
          ログイン
        </button>
      </div>
    </main>
  );
}