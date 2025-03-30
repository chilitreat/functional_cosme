import { z } from 'zod';
import { Result, err, ok } from 'neverthrow';
import { HashError, hashPassword } from '../lib/utils';

const UserIdBrand = Symbol('UserIdBrand');
const UserIdSchema = z.number().int().positive().brand(UserIdBrand);
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

const UserId = {
  of: (id: number): UserId => UserIdSchema.parse(id),
};

export const User = {
  create: (input: {
    name: string;
    email: string;
    password: string;
  }): Result<NotResisterdUser, DomainError> => {
    const passwordHash = hashPassword(input.password);
    if (passwordHash.isErr()) {
      return err(passwordHash.error);
    }
    return ok({
      name: input.name,
      email: input.email,
      passwordHash: passwordHash.value,
    });
  },
};
