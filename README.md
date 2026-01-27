# Discord Nuke Bot - Node.js

Node.js環境で動作する、Discordサーバー荒らしBotです。
チャンネル削除、チャンネル作成、ロール作成、Webhookを使用したメッセージスパム、管理者などを搭載しています。

## 必要要件
* **[Node.js v16 以上](https://nodejs.org/)**
* Discord Bot Token (Privileged Intents: **Message Content Intent**, **Server Members Intent** が必須)
* 使用モジュール: discord.js dotenv fs

## 📂 ディレクトリ構成
本スクリプトを配置するフォルダの構成例です。

```text
.
├── server.js          <-- 本体コード
├── .env               <-- 設定ファイル (トークンなど)
└── example.png        <-- スタンプ用画像 (任意)
```

## 設定ファイル (`.env`)

`.env` という名前のファイルを新規作成し、以下の内容を記述してください。

```ini
TOKEN=あなたのボットトークン
WEBHOOK_URL=実行結果を通知するWebhookのURL (オプション)
```

## 動作設定 (`index.js`内)

コード上部の定数を書き換えることで挙動をカスタマイズできます。

| 変数名 | 説明 |
| --- | --- |
| `COMMANDS` | 起動コマンドのリスト (例: `["!example", "!nuke"]`) |
| `ROLE_NAME` | 作成するロール名 |
| `ROLE_COUNT` | ロールの数 |
| `ROLE_COLOR` | ロールの色(HEX) |
| `CHANNEL_NAME` | 作成するチャンネル (オプションで後ろにランダム文字) |
| `MIN_CHANNELS` | 作成するチャンネル数 (最小) |
| `MAX_CHANNELS` | 作成するチャンネル数 (最大) |
| `NEW_SERVER_NAME` | 変更後のサーバー名 |
| `STICKER_NAME` | トリガーにするスタンプの生成時の名前 |
| `STICKER_FILE` | ファイルパス |
| `WEBHOOK_USERNAME` | Webhookで送信する際の名前 |
| `MIN_MESSAGE_PER_CHANNEL` | メッセージをスパムする回数 (最小) |
| `MAX_MESSAGE_PER_CHANNEL` | メッセージをスパムする回数 (最大) |
| `BATCH_SIZE` | 一度にリクエストするメッセージ数 (高速化用) |
| `MESSAGE_INTERVAL` | バッチ間の待機時間 |


## 使用方法

1. **起動**:
   フォルダ内でコマンドプロンプトを開き、以下を実行します。
   ```bash
   node server.js
   ```

2. **実行**:
   ボットが導入されているサーバーで、以下のいずれかを行います。
   * 設定したコマンド (デフォルト: `!example`, `!nuke`) をチャットに送信。
   * 指定したスタンプ (`Example`) を送信。

3. **機能**:
   * **Nuke**: チャンネル全削除 → ロール/チャンネル大量作成 → 全チャンネルでWebhookメッセージスパム → サーバー退出
   * **Admin付与**: `!admin` と打つと、`@everyone` ロールに管理者権限を付与します。

## ログについて

コンソールには以下の形式でログが出力されます。

* <span style="color:cyan">**[時刻]**</span> コマンド検知、参加、処理の進行状況
* エラー時は通常のコンソール出力で表示されます。

---

## ⚠️ 免責事項
このツールは教育および検証目的で作成されています。許可されていないサーバーでの使用、または利用規約に違反する行為に使用した場合の責任は一切負いません。自己責任でご利用ください。
