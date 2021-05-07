/**
 * user 서비스.
 * user의 데이터베이스에 접근하여 데이터를 관리하는 역할.
 * 또한 resolver에게 매핑한 데이터를 넘긴다.
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  // 사용자 이메일 만드는 service.
  // 사용자 계정을 만들 때, 존재하는 유저거나 에러가 나면, ok 속성을 false로 / error 속성인 string을 반환하고,
  // 계정을 만들었으면, ok 속성을 true로 보낸다.
  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<{ ok: boolean; error?: string }> {
    try {
      // 사용자 email로 계정이 존재한다면, error 문자열과 false ok를 반환한다.
      const exists = await this.users.findOne({ email });
      if (exists) {
        return { ok: false, error: 'There is a user with that email already' };
      }
      await this.users.save(this.users.create({ email, password, role }));
      return { ok: true };
    } catch (e) {
      // 만약 에러가 있다면, 아래와 같은 object를 반환한다.
      return { ok: false, error: "Couldn't create account" };
    }
  }
}
