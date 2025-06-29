import { z } from 'zod';
import { Result, err, ok } from 'neverthrow';
import { HashError, hashPassword } from '../lib/utils';

const UserIdBrand = Symbol('UserIdBrand');
export const UserIdSchema = z.number().int().positive().brand(UserIdBrand);
export type UserId = z.infer<typeof UserIdSchema>;

const UserSchema = z.object({
  userId: UserIdSchema,
  name: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  createdAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// ドメインエラーの型
type DomainError = HashError;

export type NotResisterdUser = Omit<User, 'userId' | 'createdAt'>;
export type UnsavedUser = NotResisterdUser;

// Repository Interface
export interface UserRepositoryInterface {
  save: any;
  findAll: any;
  findByEmail: any;
  findById: any;
}

export const UserId = {
  of: (id: number): UserId => UserIdSchema.parse(id),
};

export const User = {
  create: async (input: {
    name: string;
    email: string;
    password: string;
  }): Promise<Result<NotResisterdUser, DomainError>> => {
    const hash = await hashPassword(input.password);
    if (hash.isErr()) {
      return err(hash.error);
    }
    return ok({
      name: input.name,
      email: input.email,
      passwordHash: hash.value,
    });
  },
};
