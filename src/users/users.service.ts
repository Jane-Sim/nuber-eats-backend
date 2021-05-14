/**
 * user 서비스.
 * user의 데이터베이스에 접근하여 데이터를 관리하는 역할.
 * 또한 resolver에게 매핑한 데이터를 넘긴다.
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verification: Repository<Verification>,
    private readonly jwtService: JwtService,
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
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      // 해당 유저의 verification 데이터도 생성한다.
      await this.verification.save(this.verification.create({ user }));
      return { ok: true };
    } catch (e) {
      // 만약 에러가 있다면, 아래와 같은 object를 반환한다.
      return { ok: false, error: "Couldn't create account" };
    }
  }

  // 사용자의 login 서비스.
  // 사용자가 login에 성공하면, 토큰 값을 함께 보낸다.
  async login({
    email,
    password,
  }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    try {
      // email로 사용자를 찾는다.
      const user = await this.users.findOne({ email });
      if (!user) {
        return {
          ok: false,
          error: 'User not found',
        };
      }

      // user entity에서 checkPassword 함수로, 사용자가 보낸 비밀번호를 비교해본다.
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: 'Wrong password',
        };
      }
      // 비밀번호가 일치하면 토큰을 전달한다.
      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  // 사용자 아이디로 유저를 찾는 메서드
  async findById(id: number): Promise<User> {
    return this.users.findOne({ id });
  }

  // 프로필을 변경하는 함수.
  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<User> {
    const user = await this.users.findOne(userId);
    if (email) {
      user.email = email;
      // 사용자가 이메일을 변경하면 다시 검증할 수 있도록, 해당 유저 정보로 verification을 업데이트한다.
      user.verified = false;
      await this.verification.save(this.verification.create({ user }));
    }
    if (password) {
      user.password = password;
    }
    // update 함수는, db에 update 쿼리문만 날리기에, entity update를 캐치할 수 없다.
    // 고로, @BeforeUpdate 데코레이터가 있는 user entity의 hashPassword 함수가 실행되지 않는다.
    // save 함수는, 저장하려는 entity가 존재하면 해당 entity를 업데이트 해준다.
    return this.users.save(user);
  }
}
