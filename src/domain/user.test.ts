import { describe, it, expect } from 'vitest';
import { User, UserId } from './user';

describe('Userドメインのテスト', () => {
  describe('UserId', () => {
    it('有効な数値からUserIdを作成できること', () => {
      const id = 1;
      const userId = UserId.of(id);
      expect(userId).toBe(id);
    });
  });

  describe('User.create', () => {
    it('有効なデータからユーザーを作成できること', async () => {
      const userData = {
        name: 'テストユーザー',
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await User.create(userData);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const user = result.value;
        expect(user.name).toBe('テストユーザー');
        expect(user.email).toBe('test@example.com');
        expect(user.passwordHash).toBeDefined();
        expect(user.passwordHash).not.toBe('password123');
      }
    });

    it('パスワードハッシュ化に成功すること', async () => {
      const userData = {
        name: 'テストユーザー',
        email: 'test@example.com', 
        password: 'validPassword123'
      };

      const result = await User.create(userData);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.passwordHash).toMatch(/^\$2b\$/);
      }
    });
  });
});