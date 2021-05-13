import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

// 유닛테스트에서는 DB에서 데이터를 꺼내와 사용하지 않는다.
// 가짜 함수, 데이터를 사용하기 위해 mocking Repository를 생성하는 함수를 반환한다.
const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

// JwtSerivce에서 사용하는 함수를 사용하기 위해, Mock function 추가
const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
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

  // 테스트를 진행하기 전, 모듈과 서비스를 가져와 지정한다.
  beforeAll(async () => {
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
        // Jwt Service를 불러온다.
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
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
      usersRepository.findOne.mockResolvedValue(undefined);
      // user를 create 함수로 생성시, 반환하는 값을 createAccountArgs 로 지정한다.
      usersRepository.create.mockReturnValue(createAccountArgs);
      //await this.users.findOne() / mockResolvedValue  await를 쓰는 코드는 resolve,
      //this.users.create() / mockReturnValue           await를 안쓰는 코드는 return

      await service.createAccount(createAccountArgs);
      // create 함수가 1번만 실행되었는지 확인해본다.
      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      // create 함수가 어떤 인자와 같이 불렸는지 확인해본다.
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);
      // save 함수가 실행되었는지 확인해본다. (횟수 상관X)
      expect(usersRepository.save).toHaveBeenCalled();
      // save 함수가 createAccountArgs 인자와 같이 불렸는지 확인해본다.
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);
    });
  });
  it.todo('login');
  it.todo('findById');
  it.todo('editProfile');
});
