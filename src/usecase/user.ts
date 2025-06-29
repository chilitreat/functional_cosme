import { depend } from 'velona';
import { userRepository } from '../repository/UserRepository';
import { User, UserId } from '../domain/user';

export const registerUser = depend(
  { userRepo: userRepository.save },
  async (
    { userRepo },
    userData: { name: string; email: string; password: string }
  ) => {
    const userResult = await User.create(userData);

    if (userResult.isErr()) {
      return userResult;
    }

    return userRepo(userResult.value);
  }
);

export const getAllUsers = depend(
  { userRepo: userRepository.findAll },
  ({ userRepo }) => userRepo()
);

export const getUserByEmail = depend(
  { userRepo: userRepository.findByEmail },
  ({ userRepo }, email: string) => userRepo(email)
);

export const getUserById = depend(
  { userRepo: userRepository.findById },
  ({ userRepo }, userId: UserId) => userRepo(userId)
);
