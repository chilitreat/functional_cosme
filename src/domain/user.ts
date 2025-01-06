import { Effect, Either, pipe, Schema } from 'effect';
import { Left, Right } from 'effect/Either';
import { HashError, hashPassword } from '../lib/utils';

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

type CreateUserEither =
  | Left<never, NotResisterdUser>
  | Right<never, NotResisterdUser>
  | Left<any, never>
  | Right<any, never>

export const createUser = (input: {
  name: string;
  email: string;
  password: string;
}): Promise<CreateUserEither> =>
  Effect.runPromise<NotResisterdUser, DomainError>(
    Effect.gen(function* () {
      const passwordHash = yield* hashPassword(input.password);
      return {
        name: input.name,
        email: input.email,
        passwordHash,
      } as NotResisterdUser;
    })
  )
    .then(Either.right)
    .catch(Either.left);
