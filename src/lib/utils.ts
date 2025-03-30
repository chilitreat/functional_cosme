import { ResultAsync, err, ok } from 'neverthrow';

export class HashError extends Error {
  readonly _tag = 'HashError';
  constructor(readonly message: string) {
    super(message);
  }
}

// パスワードをハッシュ化する処理
export const hashPassword = (password: string): ResultAsync<string, HashError> => {
  return ResultAsync.fromPromise(
    Bun.password.hash(password),
    (error) => new HashError('Failed to hash password'+error)
  )
};
