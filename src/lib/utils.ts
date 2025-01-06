import { Effect } from "effect";

export class HashError {
  readonly _tag = 'HashError';
  constructor(readonly message: string) {}
}

// パスワードをハッシュ化する処理
export const hashPassword = (password: string): Effect.Effect<string, DomainError> =>
  Effect.tryPromise({
    try: () => Bun.password.hash(password),
    catch: () => new HashError('Failed to hash password'),
  });
