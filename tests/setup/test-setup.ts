/**
 * テストセットアップファイル
 * テスト実行前にNODE_ENVを設定
 */

// テスト環境の設定
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

console.log('Test setup: NODE_ENV set to test, JWT_SECRET configured');
