# YouTube収録基盤

## 実装した範囲と実行状況

`scripts/sync-youtube.mjs`は公式YouTube Data API v3を使用するサーバー／CLI専用の収集機構です。**APIキーは未設定で、実際の全件取得は行っていません。全数学動画の総数も未確定です。**

初期UIは、公式oEmbedで確認した3本の代表動画と独自教材を使用します。CLIが保存した取得結果は、自動的にUIへ公開しません。

## キーの設定

### 対象チャンネルの追加確認（2026-10-12）

公式サイトの[高校数学一覧](https://kouki-honda.jp/youtube_hs-math/)と[中学数学一覧](https://kouki-honda.jp/contents/)の埋め込みから、次の投稿元を確認しました。数学Ⅱ・Bと数学Ⅲの投稿者リンクは、アプリ内の公式プレーヤーで表示されたものです。Data APIによるチャンネル詳細・全動画の取得とは区別します。

| 投稿元 | チャンネルID |
| --- | --- |
| 超わかる！授業動画 | `UCZUPMvvW1ggn4gbSY741LdA` |
| 超わかる！高校数学 II・B | `UCII49VK8oCs134zyyrxl0jg` |
| 超わかる！高校数学 III | `UCxSQoMZ-Q2IwgvR5woDCJCg` |

現在のCLIは指定した一つのチャンネルを収集する足場です。M02の本収録では、確認済みの投稿元それぞれのuploadsと公式サイトの45再生リストを照合し、Video IDで統合してください。最初のチャンネルだけで全数学動画の取得完了を宣言してはいけません。公開総数は実取得後に確定します。

### 設定方法

1. 自分のGoogle CloudプロジェクトでYouTube Data API v3を有効にする。
2. APIキーのAPI制限をYouTube Data API v3に限定する。サーバーの固定IPがある場合はアプリケーション制限も設定する。
3. キーはサーバー／実行ジョブの秘密変数 `YOUTUBE_API_KEY` に設定する。ブラウザ用の`VITE_`変数、Git、公開URL、ログ、スクリーンショットに入れない。
4. `npm run sync:youtube`を実行し、`data/sync-report.json`の失敗と分類候補を確認する。

`.env.example`は変数名の見本です。このNode CLIは`.env`ファイルを自動ロードしません。シェルやジョブ管理機能の秘密変数を使ってください。キーのない実行は終了コード2で「未取得」と表示します。

## 取得手順

1. `channels.list`で指定チャンネルIDを確認し、`contentDetails.relatedPlaylists.uploads`を取得する。
2. アップロード再生リストを`playlistItems.list`で50件ずつ、`nextPageToken`がなくなるまで取得する。公式サイトにない動画もこの経路で取り込む。
3. `playlists.list`で同チャンネルの公開再生リストをページ取得し、それぞれの所属を`playlistItems.list`で確認する。
4. Video IDで重複を除き、`videos.list`の`snippet,contentDetails,status`を50 IDずつ取得する。
5. 指定チャンネルの公開動画に限って保存する。数学語・公式数学再生リストの所属は分類の候補根拠として保存し、要確認扱いにする。化学・英語の候補も独立させ、公開カタログにはレビュー後の数学動画だけを取り込む。

通常動画、Shorts、公開ライブアーカイブ、旧課程を名前や長さで除外しません。取得した動画説明文・タイトル・日時・長さ・サムネイルURL・所属・埋め込み可否・取得日時を保持します。

ファイルは一時ファイルからのrenameで更新します。429／5xx／接続失敗だけを最大3回再試行し、APIキーを含むURLはログに出しません。副次的な再生リスト・動画バッチの失敗は記録して、不完全な取得を成功扱いしません。APIから返らないIDを削除／非公開のどちらかと断定しません。

最近の情報だけを更新失敗時に保持し、30日以上前のAPIデータは保持しません。長期運用には、実行ジョブ自体が止まっても期限内にデータを更新・削除できる監視と保管期限処理が必要です。現時点では自動実行ジョブを設定していません。

## 通知と定期照合：M06の引き継ぎ

YouTubeが案内するWebSub / PubSubHubbubを用います。トピックは指定チャンネルの公式Atomフィード、hubは公式ドキュメントに記載されたものです。通知はアップロード、タイトル・説明文の更新を知るきっかけとして扱い、通知内容をそのまま確定データにはしません。

次に必要なのは、HTTPSコールバック、GETの購読検証、購読secretを使ったPOST署名検証、XMLの安全な解析、指定チャンネル照合、動画ID重複排除、取得キュー、購読期限の更新です。通知から`videos.list`による再確認を行います。取りこぼしや削除・公開状態の変更を補うため、アップロード一覧の定期照合と全メタデータの30日以内の更新も組み合わせます。

**通知受信サーバー・hub購読・定期実行・公開環境の自動取り込みは未実装／未実行です。**

## 利用条件とプレーヤー

APIデータの更新・削除、APIキー制限、利用者へのYouTube利用規約とGoogleプライバシーへの案内を運用に含めます。動画ファイルのダウンロード、認証や制限を迂回するスクレイピング、広告・公式プレーヤーの遮蔽は行いません。

再生は公式IFrame Player API。操作可能な領域を200×200px以上確保し、コントロールを維持します。アプリの再生前の表紙は、実際のプレーヤーを読み込む前だけ表示します。プレーヤー上に独自ボタンや教材を重ねません。

APIクォータは呼び出し種別・ページ数によって消費します。現在の公式クォータ表を実行前に確認し、search.listによる高コストな網羅探索を主経路にしません。

## 確認した公式ドキュメント

- [Channels](https://developers.google.com/youtube/v3/docs/channels/list)
- [PlaylistItems](https://developers.google.com/youtube/v3/docs/playlistItems/list)
- [Playlists](https://developers.google.com/youtube/v3/docs/playlists/list)
- [Videos](https://developers.google.com/youtube/v3/docs/videos/list)
- [動画取得の実装例](https://developers.google.com/youtube/v3/guides/implementation/videos)
- [Push notifications](https://developers.google.com/youtube/v3/guides/push_notifications)
- [Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
- [IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)

## 2026-10-12：個別動画の初回収録

公式サイトの45単元を、公式IFrame Player APIの`getPlaylist()`で照合しました。単元内の所属を合計すると1,053件、Video IDで重複を除くと1,022本です。公開アップロード一覧の取得を代替したものではなく、再生リスト外の動画・新着の網羅性は未確認です。

タイトル・投稿者・サムネイルはYouTube公式oEmbedで取得します。公開日時・説明文・Data API上の埋め込み可否はnullで保持します。IFrame APIで取得した動画ID、oEmbedで取得したメタデータ、未取得のフィールドを区別します。公式資料：https://developers.google.com/youtube/iframe_api_reference#Retrieving_playlist_information 。
