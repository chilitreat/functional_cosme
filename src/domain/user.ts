import { HashError, hashPassword } from '../lib/utils';
import { Result, err, ok } from 'neverthrow';

export type User = {
  userId: UserId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};
export const UserId = Schema.Number.pipe(Schema.brand('userId'));
export type UserId = typeof UserId;

// ドメインエラーの型
type DomainError = HashError;

export type NotResisterdUser = Omit<User, 'userId' | 'createdAt'>;

export const createUser = (input: {
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
};
