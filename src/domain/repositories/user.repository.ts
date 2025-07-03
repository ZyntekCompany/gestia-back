import { UserListPaginatedDto } from 'src/interfaces/dtos/user.dto';
import { User } from '../entities/User';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User, entityId?: string, areaId?: string): Promise<User>;
  updateUser(userId: string, data: Partial<User>): Promise<User>;
  saveCitizen(
    user: User,
    extra: {
      typePerson: string;
      typeIdentification: string;
      numberIdentification: string;
      phone: string;
      gender: string;
      country: string;
      birthDate: Date;
      address: string;
      city: string;
    },
  ): Promise<User>;
  delete(id: string): Promise<void>;
  listUsersPaginated(params: {
    entityId?: string;
    page?: number;
    limit?: number;
    isEmailVerified?: boolean;
    active?: boolean;
    search?: string;
    forAdmin?: boolean;
  }): Promise<UserListPaginatedDto>;
  // allUser(id: string): Promise<User[]>
}
