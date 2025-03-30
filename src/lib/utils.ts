import { Result, err, ok } from 'neverthrow';

export class HashError extends Error {
  readonly _tag = 'HashError';
  constructor(readonly message: string) {
    super(message);
  }
}

// パスワードをハッシュ化する処理
export const hashPassword = (password: string): Result<string, HashError> => {
  try {
    const hashedPassword = Bun.password.hash(password);
    return ok(hashedPassword);
  } catch {
    return err(new HashError('Failed to hash password'));
  }
};
