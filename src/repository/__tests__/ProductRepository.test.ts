/**
 * ProductRepositoryの統合テスト
 * 実際のデータベース操作とエラーハンドリングをテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { productRepository } from '../ProductRepository';
import { Product, ProductId } from '../../domain/product';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  TestDatabaseConnection,
} from '../../../tests/setup/database';
import {
  createValidProductData,
  createMultipleProductData,
} from '../../../tests/helpers/data';

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

      const result = await productRepository.save.inject({ db: testDb })(
        unsavedProduct
      );

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
      const saveWithTestDb = productRepository.save.inject({
        db: testDb,
      });

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
      const ids = savedProducts.map((p) => p.productId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('findAll - 全商品取得', () => {
    it('商品が存在しない場合は空配列を返す', async () => {
      const result = await productRepository.findAll.inject({
        db: testDb,
      })();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(Array.isArray(result.value)).toBe(true);
        expect(result.value.length).toBe(0);
      }
    });

    it('保存された商品を全て取得できる', async () => {
      // テストデータを保存
      const productsData = createMultipleProductData(2);

      for (const productData of productsData) {
        const productResult = Product.create(productData);
        if (productResult.isOk()) {
          await productRepository.save.inject({ db: testDb })(
            productResult.value
          );
        }
      }

      // 全商品を取得
      const result = await productRepository.findAll.inject({
        db: testDb,
      })();

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

      await productRepository.save.inject({ db: testDb })(productResult.value);

      const result = await productRepository.findAll.inject({
        db: testDb,
      })();

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

      const saveResult = await productRepository.save.inject({
        db: testDb,
      })(productResult.value);
      expect(saveResult.isOk()).toBe(true);
      if (!saveResult.isOk()) return;

      const savedProduct = saveResult.value;

      // 保存した商品をIDで取得
      const findResult = await productRepository.findById.inject({
        db: testDb,
      })(savedProduct.productId);

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
      const result = await productRepository.findById.inject({
        db: testDb,
      })(nonExistentId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });

    it('無効なIDでも適切に処理される', async () => {
      // 大きな値のIDで存在しないことを確認（負の値はProductIdスキーマでエラーになるため）
      const invalidId = ProductId.of(999999);
      const result = await productRepository.findById.inject({
        db: testDb,
      })(invalidId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe('データベース制約とエラーハンドリング', () => {
    it('同じ商品名でも複数保存可能（重複制約なし）', async () => {
      const productData = createValidProductData();
      const injectedSave = productRepository.save.inject({
        db: testDb,
      });

      // 同じデータで2回保存
      const product1Result = Product.create(productData);
      const product2Result = Product.create(productData);

      expect(product1Result.isOk()).toBe(true);
      expect(product2Result.isOk()).toBe(true);

      if (product1Result.isOk() && product2Result.isOk()) {
        const result1 = await injectedSave(product1Result.value);
        const result2 = await injectedSave(product2Result.value);

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

      const injectedSave = productRepository.save.inject({
        db: testDb,
      });
      const saveResult = await injectedSave(productResult.value);

      expect(saveResult.isOk()).toBe(true);
      if (!saveResult.isOk()) return;

      // 取得して確認
      const findResult = await productRepository.findById.inject({
        db: testDb,
      })(saveResult.value.productId);

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

      const result = await productRepository.save.inject({
        db: testDb,
      })(productResult.value);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(longString);
        expect(result.value.manufacturer).toBe(longString);
      }
    });
  });
});
