import { depend } from 'velona';
import { User, UserId, UserRepositoryInterface, UnsavedUser } from '../domain/';
import * as schema from '../db/schema';
import { databaseConnection, DatabaseConnectionError } from '../db/db';
import { ResultAsync } from 'neverthrow';
import { eq } from 'drizzle-orm';

const save = depend(
  { db: databaseConnection },
  ({ db }, user: UnsavedUser): ResultAsync<User, DatabaseConnectionError> =>
    ResultAsync.fromPromise(
      db
        .insert(schema.users)
        .values({
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash,
        })
        .returning({
          id: schema.users.userId,
          createdAt: schema.users.createdAt,
        })
        .execute()
        .then(([{ id, createdAt }]) => ({
          ...user,
          userId: id as UserId,
          createdAt: new Date(createdAt),
        })),
      (e) => {
        console.error('Error saving user:', e);
        // SQLite unique constraint error for email
        if ((e as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return new Error('Email already exists') as DatabaseConnectionError;
        }
        return e as DatabaseConnectionError;
      }
    )
);

const findAll = depend(
  { db: databaseConnection },
  ({ db }): ResultAsync<User[], DatabaseConnectionError> =>
    ResultAsync.fromPromise(
      db
        .select()
        .from(schema.users)
        .execute()
        .then((rows) =>
          rows.map((row) => ({
            userId: row.userId as UserId,
            name: row.name,
            email: row.email,
            passwordHash: row.passwordHash,
            createdAt: new Date(row.createdAt),
          }))
        ),
      (e) => e as DatabaseConnectionError
    )
);

const findByEmail = depend(
  { db: databaseConnection },
  (
    { db },
    email: string
  ): ResultAsync<User | undefined, DatabaseConnectionError> =>
    ResultAsync.fromPromise(
      db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1)
        .execute()
        .then((rows) => {
          if (rows.length === 0) {
            return undefined;
          }
          const [row] = rows;
          return {
            userId: row.userId as UserId,
            name: row.name,
            email: row.email,
            passwordHash: row.passwordHash,
            createdAt: new Date(row.createdAt),
          };
        }),
      (e) => e as DatabaseConnectionError
    )
);

const findById = depend(
  { db: databaseConnection },
  (
    { db },
    userId: UserId
  ): ResultAsync<User | undefined, DatabaseConnectionError> =>
    ResultAsync.fromPromise(
      db
        .select()
        .from(schema.users)
        .where(eq(schema.users.userId, userId))
        .limit(1)
        .execute()
        .then((rows) => {
          if (rows.length === 0) {
            return undefined;
          }
          const [row] = rows;
          return {
            userId: row.userId as UserId,
            name: row.name,
            email: row.email,
            passwordHash: row.passwordHash,
            createdAt: new Date(row.createdAt),
          };
        }),
      (e) => e as DatabaseConnectionError
    )
);

export const userRepository = {
  save,
  findAll,
  findByEmail,
  findById,
};
