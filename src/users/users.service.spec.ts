import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UsersService } from './users.service';

// 유닛테스트에서는 DB에서 데이터를 꺼내와 사용하지 않는다.
// 가짜 함수, 데이터를 사용하기 위해 mocking Repository를 생성하는 함수를 반환한다.
const mockRepository = () => ({
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
});

// JwtSerivce에서 사용하는 함수를 사용하기 위해, Mock function 추가
const mockJwtService = {
  sign: jest.fn(() => 'signed-token-baby'),
  verify: jest.fn(),
};

const mockMailService = {
  sendVerificationEmail: jest.fn(),
};

// Repository의 모든 함수들을 optional하게 가져오되, 함수의 타입이 mock 타입이도록 설정.
// Partial 으로 모든 속성 값을 가져오도록 만들고,
// Record를 통해 T 타입을 가진 k 리스트 유형을 만든다. ex) Record<"hello", number> number 타입을 가진 hello.
// Record를 통해 Mock 타입을 가젼, 특정 Repository의 key 값 리스트를 가져온다. 로 해석 가능하다.
// ex) usersRepository.save의 타입은 Mock. (property) save?: jest.Mock<any, any>
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

// User Service를 테스트할 유닛 테스트
describe('UserService', () => {
  // 서비스를 여러 곳에서 사용할 수 있도록, 전역변수로 빼놓는다.
  let service: UsersService;
  // MockRepository에 User entity 를 넣어, T 타입을 지정한다.
  let usersRepository: MockRepository<User>;
  let verificationsRepository: MockRepository<Verification>;
  let emailService: MailService;
  let jwtService: JwtService;

  // beforeAll: 모든 테스트를 진행하기 전, 단 한번만 모듈과 서비스를 가져와 지정한다.
  // beforeEach: 각 테스트 케이스를 진행하기 전, 한 번씩 모듈과 서비스를 가져와 지정한다.
  beforeEach(async () => {
    // createTestingModule을 통해, userService만 테스트하는 모듈을 불러온다.
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        // getRepositoryToken을 통해, 모의 User 저장소를 만든다.
        // mockRepository를 이용해, repository의 fineOne, save 등의 함수를 사용할 수 있도록 설정한다.
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        // Jwt Service를 불러온다.
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    emailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationsRepository = module.get(getRepositoryToken(Verification));
  });

  // 유저 서비스가 존재하는지 확인.
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  //사용자를 생성하는 테스트
  describe('createAccount', () => {
    // 자주 사용하는 인자 값을 전역으로 설정
    const createAccountArgs = {
      email: '',
      password: '',
      role: 0,
    };

    // 존재하는 사용자를 생성할 때, 실패하는 테스트
    it('should fail if use exists', async () => {
      // mockResolvedValue을 이용해서, usersRepository에서 findOne 함수는,
      // 설정한 값을 반환할 거라고 설정하자.
      // 그러면, findOne이 TypeOrm을 통해 DB에 가지않고, 해당 mock value를 반환한다.
      // 또한 유저가 존재한다는 조건이 생긴다.
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'aalalalalalalal',
      });
      // createAccount를 실행하면,
      const result = await service.createAccount(createAccountArgs);
      // 위에서 findOne을 통해 유저를 반환하기에, 결과 값이 아래와 일치하는걸 확인할 수 있다.
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });

    // 사용자를 생성하는 테스트.
    it('should create a new user', async () => {
      /** typeOrm을 통해 반환되는 값을 지정한다. */
      //await this.users.findOne() / mockResolvedValue  await를 쓰는 코드는 resolve,
      //this.users.create() / mockReturnValue           await를 안쓰는 코드는 return

      // findOne을 통해 반환되는 유저 값이 없어야, 전체 코드가 실행가능.
      usersRepository.findOne.mockResolvedValue(undefined);
      // user를 create 함수로 생성시, 반환하는 값을 createAccountArgs 로 지정한다.
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);
      // verifications의 create, save시 반환되는 값을 지정한다.
      verificationsRepository.create.mockReturnValue({
        user: createAccountArgs,
      });
      verificationsRepository.save.mockResolvedValue({
        code: 'code',
      });

      /** createAccount 서비스 실행시, 각 함수들이 실행되었는지 테스트한다. */
      const result = await service.createAccount(createAccountArgs);

      // user create 함수가 1번만 실행되었는지 확인해본다.
      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      // user create 함수가 createAccountArgs 인자와 같이 불렸는지 확인해본다.
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);

      // user save 함수가 실행되었는지 확인해본다. (횟수 상관X)
      expect(usersRepository.save).toHaveBeenCalled();
      // user save 함수가 createAccountArgs 인자와 같이 불렸는지 확인해본다.
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);

      // verification create 함수가 1번만 실행되었는지 확인해본다.
      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      // verification create 함수가 createAccountArgs 인자와 같이 불렸는지 확인해본다.
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });
      // verification save 함수가 실행되었는지 확인해본다. (횟수 상관X)
      expect(verificationsRepository.save).toHaveBeenCalled();
      // verification save 함수가 createAccountArgs 인자와 같이 불렸는지 확인해본다.
      expect(verificationsRepository.save).toHaveBeenCalledWith({
        user: createAccountArgs,
      });
      // emailService sendVerificationEmail 함수가 1번만 실행되었는지 확인해본다.
      expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      // expect.any()를 통해, 인자 값 type을 체크할 수 있다.
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
      // createAccount의 결과 값이 일치하는지 마지막으로 테스트해본다.
      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      // findOne을 통해 aait이 fail 하도록 에러를 설정한다.
      usersRepository.findOne.mockRejectedValue(new Error('Async error'));
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ ok: false, error: "Couldn't create account" });
    });
  });

  // 로그인을 시도하는 테스트
  describe('login', () => {
    // 로그인 테스트 데이터
    const loginArgs = {
      email: 'ssiox3@gmail.com',
      password: 'ssiox3.password',
    };

    // user를 못 찾을 때의 테스트
    it('should fail if user does not exist', async () => {
      // user findOne의 반환 값을 null로 지정.
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.login(loginArgs);

      // user findOne이 1번만 불렸는지, email, select Object와 같이 호출되었는지 확인한다.
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      // 유저를 못 찾았다면, 아래의 반환 값과 일치해야한다.
      expect(result).toEqual({
        ok: false,
        error: 'User not found',
      });
    });

    // user의 비밀번호가 일치하지 않는 테스트
    it('should fail if the password is wrong', async () => {
      // 유저의 비밀번호가 틀리는 상황을 위해, checkPassword 함수가 false 를 반환하도록 설정한다.
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };

      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      // checkPassword가 false라면, 아래의 반환 값과 일치해야한다.
      expect(result).toEqual({
        ok: false,
        error: 'Wrong password',
      });
    });

    // 로그인이 성공 시 토큰을 반환하는지 테스트
    it('should return token if password correct', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);

      const result = await service.login(loginArgs);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
      expect(result).toEqual({
        ok: true,
        token: 'signed-token-baby',
      });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error('Async error'));
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: expect.any(Error) });
    });
  });

  // 사용자 아이디로 유저를 찾는 테스트
  describe('findById', () => {
    // 사용자를 찾는데 사용하는 데이터
    const findByIdArgs = {
      id: 1,
    };

    // 유저를 찾았을 경우
    it('should find an existing user', async () => {
      usersRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(1);
      expect(result).toEqual({ ok: true, user: findByIdArgs });
    });

    // 유저를 찾지 못했을 경우
    it('should fail if no user is found', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error('Async error'));
      const result = await service.findById(1);
      expect(result).toEqual({ ok: false, error: 'User Not Found' });
    });
  });

  // 사용자의 프로필 정보를 변경하는 테스트
  describe('editProfile', () => {
    // 이메일 변경 시,
    it('should change email', async () => {
      // 사용자 정보를 변경하기 전, 유저 데이터
      const oldUser = {
        email: 'ssiox3@gmail.com',
        verified: true,
      };
      // 변경하고자 하는 유저 데이터
      const editProfileArgs = {
        userId: 1,
        input: { email: 'ssiox@naver.com' },
      };
      // email 변경시 새로운 uuid 값을 가진 verification 데이터
      const newVerification = {
        code: 'code',
      };
      // 이메일 변경이 완료된 새로운 유저 데이터
      const newUser = {
        verified: false,
        email: editProfileArgs.input.email,
      };

      // user findone의 반환 값을 현재 유저 데이터로 반환 설정.
      usersRepository.findOne.mockResolvedValue(oldUser);
      // user.email 데이터가 있을 시, 생성할 verification의 create, save 반환 값.
      // create 함수는 promise를 반환하지 않는다. entity 속성만 복사해서 새 entity instance를 생성하기 때문.
      verificationsRepository.create.mockReturnValue(newVerification);
      verificationsRepository.save.mockResolvedValue(newVerification);

      await service.editProfile(editProfileArgs.userId, editProfileArgs.input);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      // findOne은 찾고자 하는 user id와 함께 호출된다.
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        editProfileArgs.userId,
      );
      // verification create는, 새 유저 정보와 호출된다.
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: newUser,
      });
      // verification save는, code 속성 값이 담긴 verification entity와 호출된다.
      expect(verificationsRepository.save).toHaveBeenCalledWith(
        newVerification,
      );

      // emailService의 sendVerificationEmail 함수는, 사용자에게 검증 이메일을 보내기 위해,
      // email값이 변경된 유저의 이메일과 새로운 code를 함께 호출한다.
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.email,
        newVerification.code,
      );
    });

    // 비밀번호 변경 시,
    it('should change password', async () => {
      // 변경하고자 하는 유저 데이터
      const editProfileArgs = {
        userId: 1,
        input: { password: 'new.password' },
      };
      // user findOne은 현재 유저의 정보를 반환한다.
      usersRepository.findOne.mockResolvedValue({ password: 'old' });

      const result = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      // user save함수는 1번 호출되고, 변경된 password 값과 함께 호출된다.
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(editProfileArgs.input);
      // 결과 값이 아래와 같으면 완료.
      expect(result).toEqual({
        ok: true,
      });
    });

    //
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.editProfile(1, { email: '12' });
      expect(result).toEqual({ ok: false, error: 'Could not update profile.' });
    });
  });

  // 사용자의 이메일에서 검증을 받은 경우, 사용자 검증 변경 테스트
  describe('verifyEmail', () => {
    // 이메일 검증이 되었을 때
    it('should verfiy email', async () => {
      // 현재 verification에 포함된 유저의 정보
      const mockedVerification = {
        user: { verified: false },
        id: 1,
      };
      // verification findOne의 반환 값을 설정.
      verificationsRepository.findOne.mockResolvedValue(mockedVerification);

      const result = await service.verifyEmail('');

      // verification findOne 함수는 1번 호출되고, 2개의 obejct 파라미터 값을 받는다.
      expect(verificationsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      // verification 데이터가 있을 경우, user.verified = true 로 변경된 유저의 값을 다시 저장한다.
      // save는 1번 호출되고, 아래의 verfied true로 저장된걸 확인할 수 있다.
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({ verified: true });

      // 유저의 검증 데이터가 변경되면, 해당 유저의 verification 데이터를 삭제한다.
      expect(verificationsRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.delete).toHaveBeenCalledWith(
        mockedVerification.id,
      );

      expect(result).toEqual({
        ok: true,
      });
    });

    // 존재하지 않는 verification 데이터일 경우
    it('should fail on verification not found', async () => {
      verificationsRepository.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail('');
      expect(result).toEqual({ ok: false, error: 'Verification not found.' });
    });

    // findOne 함수가 Error 를 던질 때
    it('should fail on exception', async () => {
      verificationsRepository.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail('');
      expect(result).toEqual({ ok: false, error: 'Could not verify email.' });
    });
  });
});
