# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開発コマンド

```bash
# 開発サーバー起動（ホットリロード）
npm run dev

# プロダクションビルド  
npm run build

# テスト実行
npm run test

# DBマイグレーション生成
npm run migration:generate

# DBマイグレーション実行
npm run migration:run

# シードデータ投入
npm run seed:run
```

## アーキテクチャ概要

このプロジェクトは**関数型プログラミング**と**クリーンアーキテクチャ**を採用した化粧品クチコミAPIです。Node.js v22で実行します。

### レイヤー構造

1. **Domain層** (`/src/domain/`)
   - 純粋なビジネスロジック、外部依存なし
   - Zodスキーマによる強い型付けとbranded型のID
   - エンティティ: `Product`, `User`, `Review`
   - ドメインエラー定義とファクトリメソッド

2. **UseCase層** (`/src/usecase/`)
   - アプリケーション固有のビジネスルール
   - `velona`による依存性注入
   - ドメインエンティティとリポジトリの協調

3. **Repository層** (`/src/repository/`)
   - データアクセス抽象化
   - Drizzle ORMによるDB操作
   - `neverthrow`によるResult型エラーハンドリング

4. **API層** (`/src/api/`)
   - HonoフレームワークによるHTTPインターフェース
   - OpenAPI仕様による自動ドキュメント生成
   - JWT認証ミドルウェア

### 重要な設計パターン

- **Result型**: 例外の代わりに`neverthrow`を使用
- **関数型依存注入**: `velona`による純粋関数の合成
- **型安全性**: branded型とZodによる実行時バリデーション
- **OpenAPI統合**: ZodスキーマからSwagger UI自動生成 (`/doc`)

### データベース設計

- **ORM**: Drizzle + better-sqlite3
- **マイグレーション**: `/migrations/`ディレクトリで管理
- **主要テーブル**: users, products, reviews
- **リレーション**: 外部キー制約による整合性保証

### 認証・セキュリティ

- **JWT認証**: 保護されたエンドポイント用
- **パスワードハッシュ化**: bcryptでハッシュ化・verify
- **入力検証**: APIバウンダリでのZodバリデーション

### 開発時の注意点

- エラーハンドリングは必ずResult型を使用（例外throw禁止）
- 新しいエンティティ追加時はドメイン層から開始
- APIエンドポイント追加時はOpenAPIスキーマも定義
- branded型を使用してIDの混在を防止
- 依存性注入は`velona`パターンに従う
- UUID生成はNode.js標準の`crypto.randomUUID()`を使用

### テスト環境

- **テストランナー**: Vitest
- **設定ファイル**: `vitest.config.ts`（テスト専用設定）
- **テストファイル**: `src/**/*.test.ts`, `src/**/*.spec.ts`
- **カバレッジ**: v8プロバイダー（HTML/JSON/テキスト形式）
- **実行環境**: Node.js環境でのテスト実行

### API仕様確認

- **Swagger UI**: `http://localhost:3000/doc`
- **OpenAPI仕様**: `http://localhost:3000/specification`

