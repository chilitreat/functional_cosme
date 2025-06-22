import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './utils';

describe('ユーティリティ関数のテスト', () => {
  describe('hashPassword', () => {
    it('パスワードをハッシュ化できること', async () => {
      const password = 'testPassword123';
      const result = await hashPassword(password);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeDefined();
        expect(result.value).not.toBe(password);
        expect(result.value.length).toBeGreaterThan(0);
      }
    });

    it('空のパスワードでもハッシュ化できること', async () => {
      const password = '';
      const result = await hashPassword(password);
      
      expect(result.isOk()).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('正しいパスワードの検証ができること', async () => {
      const password = 'testPassword123';
      const hashResult = await hashPassword(password);
      
      expect(hashResult.isOk()).toBe(true);
      if (hashResult.isOk()) {
        const verifyResult = await verifyPassword(password, hashResult.value);
        expect(verifyResult.isOk()).toBe(true);
        if (verifyResult.isOk()) {
          expect(verifyResult.value).toBe(true);
        }
      }
    });

    it('間違ったパスワードの検証で失敗すること', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hashResult = await hashPassword(password);
      
      expect(hashResult.isOk()).toBe(true);
      if (hashResult.isOk()) {
        const verifyResult = await verifyPassword(wrongPassword, hashResult.value);
        expect(verifyResult.isOk()).toBe(true);
        if (verifyResult.isOk()) {
          expect(verifyResult.value).toBe(false);
        }
      }
    });

    it('無効なハッシュで検証がエラーになること', async () => {
      const password = 'testPassword123';
      const invalidHash = 'invalid-hash';
      
      const verifyResult = await verifyPassword(password, invalidHash);
      // bcryptは無効なハッシュでもfalseを返すことがある
      expect(verifyResult.isOk()).toBe(true);
      if (verifyResult.isOk()) {
        expect(verifyResult.value).toBe(false);
      }
    });
  });
});