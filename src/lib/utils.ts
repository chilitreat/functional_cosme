import { Effect } from "effect";

export class HashError extends Error{
  readonly _tag = 'HashError';
  constructor(readonly message: string) {
    super(message);
  }
}

// パスワードをハッシュ化する処理
export const hashPassword = (password: string): Effect.Effect<string, HashError> =>
  Effect.tryPromise({
    try: () => Bun.password.hash(password),
    catch: () => new HashError('Failed to hash password'),
  });
