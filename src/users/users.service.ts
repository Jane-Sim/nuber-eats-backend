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
  // 사용자 계정을 만들 때, 존재하는 유저거나 에러가 나면 string 을 반환하고,
  // 계정을 만들었으면, return 값을 반환하지 않아서 undefined가 전달된다.
  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<string | undefined> {
    try {
      // 사용자 email로 계정이 존재한다면, error 문자열을 반환한다.
      const exists = await this.users.findOne({ email });
      if (exists) {
        return 'There is a user with that email already';
      }
      // 만약 사용자가 없다면, 해당 사용자를 생성하고, 아무것도 반환하지 않는다.
      // 아무것도 반환하지 않으면, return 값은 undefined로 반환된다.
      await this.users.save(this.users.create({ email, password, role }));
    } catch (e) {
      // 만약 에러가 있다면, 아래와 같은 문자열이 반환된다.
      return "Couldn't create account";
    }
  }
}
