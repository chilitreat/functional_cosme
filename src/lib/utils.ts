import { ResultAsync, err, ok } from 'neverthrow';
import bcrypt from 'bcrypt';

export class HashError extends Error {
  readonly _tag = 'HashError';
  constructor(readonly message: string) {
    super(message);
  }
}

// パスワードをハッシュ化する処理
export const hashPassword = (password: string): ResultAsync<string, HashError> => {
  return ResultAsync.fromPromise(
    bcrypt.hash(password, 10),
    (error) => new HashError('Failed to hash password: ' + error)
  )
};

// パスワード検証
export const verifyPassword = (password: string, hash: string): ResultAsync<boolean, HashError> => {
  return ResultAsync.fromPromise(
    bcrypt.compare(password, hash),
    (error) => new HashError('Failed to verify password: ' + error)
  )
};
