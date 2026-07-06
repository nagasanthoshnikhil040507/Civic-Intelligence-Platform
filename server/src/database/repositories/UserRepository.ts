import { BaseRepository } from './BaseRepository';
import { User, IUser } from '../models/User';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string) {
    return this.findOne({ email, isDeleted: false });
  }

  async findByRole(role: string) {
    return this.findMany({ role, isDeleted: false }, { lean: true });
  }

  async findActiveUsers() {
    return this.findMany({ status: 'active', isDeleted: false }, { lean: true });
  }

  async updateLastLogin(userId: string, ip: string, device: string) {
    return this.model.findByIdAndUpdate(
      userId,
      {
        $push: {
          loginHistory: {
            $each: [{ ip, device, timestamp: new Date() }],
            $slice: -10 
          }
        }
      },
      { new: true }
    ).exec();
  }
}
