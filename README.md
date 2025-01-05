関数型ドメインモデリングを読みながら、サンプルアプリを作成します。

## Example

To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3000

## 技術スタック

- Lang: TypeScript
- Runtime: Bun
- Style: Functional Programming with Effect-TS
- Web Framework: Hono
- Validation: zod, @hono/zod-validator
- ORM: drizzle-orm
- DB: SQLite

## アプリケーション仕様

化粧品のクチコミ投稿サイトでは、ユーザーが化粧品の商品情報を確認したり、クチコミを投稿したり、他のユーザーのクチコミを閲覧できます。
このリポジトリでは、バックエンドのAPIを提供します。

### 主な機能

- ユーザー管理
  - ユーザー登録（名前、メールアドレス、パスワード）
  - ログイン／ログアウト
  - プロフィールの閲覧と更新
- 商品管理
  - 商品一覧の閲覧
  - 商品の詳細情報の閲覧（商品名、メーカー、カテゴリ、成分情報など）
  - 新しい商品の追加（管理者専用）
- クチコミ管理
  - クチコミの投稿（評価、コメント）
  - クチコミの編集・削除（投稿者のみ可能）
  - クチコミの一覧表示（評価の高い順、最新順など）
- 検索とフィルタ
  - 商品名やカテゴリで検索
  - 評価や価格帯でのフィルタリング
- ランキング機能
  - 評価が高い商品ランキング
  - 最近人気のクチコミランキング

### データモデル

- User(ユーザー)
  - UserId: ユニークな識別子
  - Name: ユーザー名
  - Email: メールアドレス
  - Password: ハッシュ化されたパスワード
  - CreatedAt: 作成日
- Product(商品)
  - ProductId: ユニークな識別子
  - Name: 商品名
  - Manufacturer: メーカー
  - Category: カテゴリ（例: スキンケア、メイクアップ）
  - Ingredients: 成分情報
  - CreatedAt: 作成日
- Review(クチコミ)
  - ReviewId: ユニークな識別子
  - ProductId: 紐付く商品ID
  - UserId: 投稿者のユーザーID
  - Rating: 評価（1～5）
  - Comment: コメント
  - CreatedAt: 作成日

### APIエンドポイント

- ユーザー関連
  - POST /users/register: ユーザー登録
  - POST /users/login: ログイン
  - GET /users/profile: プロフィール閲覧
  - PUT /users/profile: プロフィール更新
- 商品関連
  - GET /products: 商品一覧取得
  - GET /products/:id: 商品詳細取得
  - POST /products: 新しい商品の追加（管理者専用）
- クチコミ関連
  - GET /reviews?productId=:id: クチコミ一覧取得
  - POST /reviews: クチコミ投稿
  - PUT /reviews/:id: クチコミ編集
  - DELETE /reviews/:id: クチコミ削除