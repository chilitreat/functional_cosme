import { describe, it, expect } from 'vitest';
import { Product, ProductId, ProductCategory } from './product';

describe('Productドメインのテスト', () => {
  describe('ProductId', () => {
    it('有効な数値からProductIdを作成できること', () => {
      const id = 1;
      const productId = ProductId.of(id);
      expect(productId).toBe(id);
    });
  });

  describe('ProductCategory', () => {
    it('有効なカテゴリを判定できること', () => {
      const validCategories = ['skin_care', 'makeup', 'fragrance', 'hair_care', 'body_care'];
      
      validCategories.forEach(category => {
        const isValid = ProductCategory.isValid(category);
        expect(isValid).toBe(true);
      });
    });

    it('無効なカテゴリを判定できること', () => {
      const invalidCategory = 'invalid-category';
      const isValid = ProductCategory.isValid(invalidCategory);
      expect(isValid).toBe(false);
    });
  });

  describe('Product.of', () => {
    it('有効なデータからProductオブジェクトを作成できること', () => {
      const productData = {
        id: 1,
        name: 'テスト化粧品',
        manufacturer: 'テストメーカー',
        category: 'skin_care',
        ingredients: ['water', 'glycerin', 'alcohol'],
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const result = Product.of(productData);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const product = result.value;
        expect(product.productId).toBe(1);
        expect(product.name).toBe('テスト化粧品');
        expect(product.manufacturer).toBe('テストメーカー');
        expect(product.category).toBe('skin_care');
        expect(product.ingredients).toEqual(['water', 'glycerin', 'alcohol']);
      }
    });

    it('無効なカテゴリでエラーが発生すること', () => {
      const productData = {
        id: 1,
        name: 'テスト化粧品',
        manufacturer: 'テストメーカー',
        category: 'invalid-category',
        ingredients: ['water', 'glycerin', 'alcohol'],
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const result = Product.of(productData);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('Product.create', () => {
    it('有効なデータから製品を作成できること', () => {
      const productData = {
        name: 'テスト化粧品',
        manufacturer: 'テストメーカー',
        category: 'makeup',
        ingredients: ['mica', 'titanium dioxide', 'iron oxides']
      };

      const result = Product.create(productData);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const product = result.value;
        expect(product.name).toBe('テスト化粧品');
        expect(product.manufacturer).toBe('テストメーカー');
        expect(product.category).toBe('makeup');
        expect(product.ingredients).toEqual(['mica', 'titanium dioxide', 'iron oxides']);
      }
    });

    it('無効なカテゴリでエラーが発生すること', () => {
      const productData = {
        name: 'テスト化粧品',
        manufacturer: 'テストメーカー',
        category: 'invalid-category',
        ingredients: ['water', 'glycerin']
      };

      const result = Product.create(productData);
      expect(result.isErr()).toBe(true);
    });
  });
});