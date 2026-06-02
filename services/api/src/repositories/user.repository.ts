import { prisma, type Prisma, type User, type UserRole } from "@princy/database";

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type UserWithPasswordHash = SafeUser & {
  passwordHash: string;
};

export type CreateUserInput = Pick<User, "email" | "name" | "passwordHash"> & {
  role?: UserRole;
};

export type UpdateUserInput = Partial<Pick<User, "email" | "name" | "passwordHash" | "role">>;

export interface UserRepositoryLike {
  findUserByEmail(email: string): Promise<SafeUser | null>;
  findUserById(id: string): Promise<SafeUser | null>;
  findUserForAuthByEmail(email: string): Promise<UserWithPasswordHash | null>;
  createUser(data: CreateUserInput): Promise<SafeUser>;
  updateUser(id: string, data: UpdateUserInput): Promise<SafeUser>;
  listUsers(): Promise<SafeUser[]>;
}

function sanitizeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function toUserWithPasswordHash(user: User): UserWithPasswordHash {
  return {
    ...sanitizeUser(user),
    passwordHash: user.passwordHash
  };
}

export class UserRepository implements UserRepositoryLike {
  async findUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    return user ? sanitizeUser(user) : null;
  }

  async findUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    return user ? sanitizeUser(user) : null;
  }

  async findUserForAuthByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    return user ? toUserWithPasswordHash(user) : null;
  }

  async createUser(data: CreateUserInput) {
    const user = await prisma.user.create({
      data
    });

    return sanitizeUser(user);
  }

  async updateUser(id: string, data: UpdateUserInput) {
    const user = await prisma.user.update({
      where: { id },
      data: data as Prisma.UserUpdateInput
    });

    return sanitizeUser(user);
  }

  async listUsers() {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });

    return users.map(sanitizeUser);
  }
}
