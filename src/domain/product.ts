
export type Product = {
  productId: productId;
  name: string;
  manufacturer: string;
  category: productCategory;
  ingredients: string[];
  createdAt: Date;
};
export type productId = number;
type productCategory = 'skin_care' | 'makeup' | 'fragrance' | 'hair_care' | 'body_care';
