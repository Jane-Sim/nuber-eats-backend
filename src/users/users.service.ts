/**
 * user 서비스.
 * user의 데이터베이스에 접근하여 데이터를 관리하는 역할.
 * 또한 resolver에게 매핑한 데이터를 넘긴다.
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // 사용자 이메일 만드는 service.
  // 사용자 계정을 만들 때, 존재하는 유저거나 에러가 나면, ok 속성을 false로 / error 속성인 string을 반환하고,
  // 계정을 만들었으면, ok 속성을 true로 보낸다.
  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
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
      const verification = await this.verifications.save(
        this.verifications.create({ user }),
      );
      // 사용자가 해당 이메일로 검증할 수 있도록, 메일을 보낸다.
      this.mailService.sendVerificationEmail(user.email, verification.code);
      return { ok: true };
    } catch (e) {
      // 만약 에러가 있다면, 아래와 같은 object를 반환한다.
      return { ok: false, error: "Couldn't create account" };
    }
  }

  // 사용자의 login 서비스.
  // 사용자가 login에 성공하면, 토큰 값을 함께 보낸다.
  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      // email로 사용자를 찾는다. password 속성 값이 select: false로 지정되어 있기에,
      // select를 통해서 id와 password select 쿼리문을 작성해준다.
      const user = await this.users.findOne(
        { email },
        { select: ['id', 'password'] },
      );
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
  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail({ id });
      return {
        ok: true,
        user: user,
      };
    } catch (error) {
      return { ok: false, error: 'User Not Found' };
    }
  }

  // 프로필을 변경하는 함수.
  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne(userId);
      if (email) {
        user.email = email;
        // 사용자가 이메일을 변경하면 다시 검증할 수 있도록, 해당 유저 정보로 verification을 업데이트한다.
        user.verified = false;
        const verification = await this.verifications.save(
          this.verifications.create({ user }),
        );
        // 사용자가 변경한 이메일로 검증할 수 있도록, 메일을 보낸다.
        this.mailService.sendVerificationEmail(user.email, verification.code);
      }
      if (password) {
        user.password = password;
      }
      // update 함수는, db에 update 쿼리문만 날리기에, entity update를 캐치할 수 없다.
      // 고로, @BeforeUpdate 데코레이터가 있는 user entity의 hashPassword 함수가 실행되지 않는다.
      // save 함수는, 저장하려는 entity가 존재하면 해당 entity를 업데이트 해주기에 update 대신 save를 사용한다.
      this.users.save(user);
      return {
        ok: true,
      };
    } catch (error) {
      return { ok: false, error: 'Could not update profile.' };
    }
  }

  // 사용자의 이메일을 통해, 검증 code를 받은 경우,
  // 해당 사용자의 검증 상태를 변경해준다.
  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne(
        { code },
        // relations 설정을 해야, typeOrm의 relation 속성이 발동된다.
        // relations는 해당 entity object를 가져오며, loadRelationIds는 해당 entity의 foregin key인 id값만 가져온다.
        { relations: ['user'] },
      );
      if (verification) {
        verification.user.verified = true;
        await this.users.save(verification.user);
        // 인증이 완료된 유저의 verification 데이터는 필요가 없으니 삭제한다.
        await this.verifications.delete(verification.id);
        return {
          ok: true,
        };
      }
      return { ok: false, error: 'Verification not found.' };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
