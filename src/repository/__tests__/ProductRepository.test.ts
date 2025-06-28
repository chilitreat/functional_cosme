/**
 * ProductRepositoryの統合テスト
 * 実際のデータベース操作とエラーハンドリングをテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { productRepository } from '../ProductRepository';
import { Product, ProductId } from '../../domain/product';
import * as schema from '../../db/schema';
import { setupTestDatabase, cleanupTestDatabase, clearAllTables, TestDatabaseConnection } from '../../../tests/setup/database';
import { createValidProductData, createMultipleProductData } from '../../../tests/helpers/data';

describe('ProductRepository Integration Tests', () => {
  let testDb: TestDatabaseConnection;

  beforeEach(async () => {
    testDb = await setupTestDatabase();
  });

  afterEach(() => {
    cleanupTestDatabase(testDb);
  });

  describe('save - 商品保存', () => {
    it('有効な商品データを保存してIDが自動生成される', async () => {
      const productData = createValidProductData();
      const productResult = Product.create(productData);
      
      expect(productResult.isOk()).toBe(true);
      if (!productResult.isOk()) return;

      const unsavedProduct = productResult.value;

      // velona依存性注入を使用してテストDBを注入
      const saveWithTestDb = productRepository.save({ db: testDb });
      const result = await saveWithTestDb(unsavedProduct);

      expect(result.isOk()).toBe(true);
      if (!result.isOk()) return;

      const savedProduct = result.value;
      expect(savedProduct.productId).toBeDefined();
      expect(typeof savedProduct.productId).toBe('number');
      expect(savedProduct.name).toBe(productData.name);
      expect(savedProduct.manufacturer).toBe(productData.manufacturer);
      expect(savedProduct.category).toBe(productData.category);
      expect(savedProduct.ingredients).toEqual(productData.ingredients);
    });

    it('複数の商品を順次保存できる', async () => {
      const productsData = createMultipleProductData(3);
      const saveWithTestDb = productRepository.save({ db: testDb });

      const savedProducts = [];
      for (const productData of productsData) {
        const productResult = Product.create(productData);
        expect(productResult.isOk()).toBe(true);
        if (!productResult.isOk()) continue;

        const result = await saveWithTestDb(productResult.value);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          savedProducts.push(result.value);
        }
      }

      expect(savedProducts.length).toBe(3);
      
      // IDが異なることを確認
      const ids = savedProducts.map(p => p.productId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it('無効なカテゴリの商品も保存される（ログ出力されるが処理は続行）', async () => {
      const invalidProductData = {
        name: 'Test Product',
        manufacturer: 'Test Manufacturer',
        category: 'invalid_category',
        ingredients: ['ingredient1', 'ingredient2'],
        createdAt: new Date(),
      };

      const saveWithTestDb = productRepository.save({ db: testDb });
      const result = await saveWithTestDb(invalidProductData);

      // 現在の実装では無効カテゴリでも保存される
      expect(result.isOk()).toBe(true);
    });
  });

  describe('findAll - 全商品取得', () => {
    it('商品が存在しない場合は空配列を返す', async () => {
      const findAllWithTestDb = productRepository.findAll({ db: testDb });
      const result = await findAllWithTestDb();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(Array.isArray(result.value)).toBe(true);
        expect(result.value.length).toBe(0);
      }
    });

    it('保存された商品を全て取得できる', async () => {
      // テストデータを保存
      const productsData = createMultipleProductData(2);
      const saveWithTestDb = productRepository.save({ db: testDb });

      for (const productData of productsData) {
        const productResult = Product.create(productData);
        if (productResult.isOk()) {
          await saveWithTestDb(productResult.value);
        }
      }

      // 全商品を取得
      const findAllWithTestDb = productRepository.findAll({ db: testDb });
      const result = await findAllWithTestDb();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBe(2);
        
        const product = result.value[0];
        expect(product).toHaveProperty('productId');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('manufacturer');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('ingredients');
        expect(product).toHaveProperty('createdAt');
      }
    });

    it('成分が正しく配列として復元される', async () => {
      const productData = createValidProductData();
      const productResult = Product.create(productData);
      expect(productResult.isOk()).toBe(true);
      if (!productResult.isOk()) return;

      const saveWithTestDb = productRepository.save({ db: testDb });
      await saveWithTestDb(productResult.value);

      const findAllWithTestDb = productRepository.findAll({ db: testDb });
      const result = await findAllWithTestDb();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const [product] = result.value;
        expect(Array.isArray(product.ingredients)).toBe(true);
        expect(product.ingredients).toEqual(productData.ingredients);
      }
    });
  });

  describe('findById - ID指定商品取得', () => {
    it('存在するIDの商品を取得できる', async () => {
      // テスト商品を保存
      const productData = createValidProductData();
      const productResult = Product.create(productData);
      expect(productResult.isOk()).toBe(true);
      if (!productResult.isOk()) return;

      const saveWithTestDb = productRepository.save({ db: testDb });
      const saveResult = await saveWithTestDb(productResult.value);
      expect(saveResult.isOk()).toBe(true);
      if (!saveResult.isOk()) return;

      const savedProduct = saveResult.value;

      // 保存した商品をIDで取得
      const findByIdWithTestDb = productRepository.findById({ db: testDb });
      const findResult = await findByIdWithTestDb(savedProduct.productId);

      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        const foundProduct = findResult.value;
        expect(foundProduct).toBeDefined();
        expect(foundProduct!.productId).toBe(savedProduct.productId);
        expect(foundProduct!.name).toBe(savedProduct.name);
        expect(foundProduct!.manufacturer).toBe(savedProduct.manufacturer);
      }
    });

    it('存在しないIDの場合はundefinedを返す', async () => {
      const nonExistentId = ProductId.of(99999);
      const findByIdWithTestDb = productRepository.findById({ db: testDb });
      const result = await findByIdWithTestDb(nonExistentId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });

    it('負のIDでも適切に処理される', async () => {
      const invalidId = ProductId.of(-1);
      const findByIdWithTestDb = productRepository.findById({ db: testDb });
      const result = await findByIdWithTestDb(invalidId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe('データベース制約とエラーハンドリング', () => {
    it('同じ商品名でも複数保存可能（重複制約なし）', async () => {
      const productData = createValidProductData();
      const saveWithTestDb = productRepository.save({ db: testDb });

      // 同じデータで2回保存
      const product1Result = Product.create(productData);
      const product2Result = Product.create(productData);

      expect(product1Result.isOk()).toBe(true);
      expect(product2Result.isOk()).toBe(true);
      
      if (product1Result.isOk() && product2Result.isOk()) {
        const result1 = await saveWithTestDb(product1Result.value);
        const result2 = await saveWithTestDb(product2Result.value);

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);

        if (result1.isOk() && result2.isOk()) {
          // 異なるIDが割り当てられることを確認
          expect(result1.value.productId).not.toBe(result2.value.productId);
        }
      }
    });

    it('空の成分配列でも正常に保存・取得できる', async () => {
      const productData = {
        ...createValidProductData(),
        ingredients: [], // 空の成分配列
      };

      const productResult = Product.create(productData);
      expect(productResult.isOk()).toBe(true);
      if (!productResult.isOk()) return;

      const saveWithTestDb = productRepository.save({ db: testDb });
      const saveResult = await saveWithTestDb(productResult.value);

      expect(saveResult.isOk()).toBe(true);
      if (!saveResult.isOk()) return;

      // 取得して確認
      const findByIdWithTestDb = productRepository.findById({ db: testDb });
      const findResult = await findByIdWithTestDb(saveResult.value.productId);

      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk() && findResult.value) {
        expect(findResult.value.ingredients).toEqual([]);
      }
    });

    it('長い文字列でも適切に保存される', async () => {
      const longString = 'A'.repeat(1000);
      const productData = {
        name: longString,
        manufacturer: longString,
        category: 'skin_care' as const,
        ingredients: [longString, longString],
      };

      const productResult = Product.create(productData);
      expect(productResult.isOk()).toBe(true);
      if (!productResult.isOk()) return;

      const saveWithTestDb = productRepository.save({ db: testDb });
      const result = await saveWithTestDb(productResult.value);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(longString);
        expect(result.value.manufacturer).toBe(longString);
      }
    });
  });
});