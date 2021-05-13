import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

// 유닛테스트에서는 DB에서 데이터를 꺼내와 사용하지 않는다.
// 가짜 함수, 데이터를 사용하기 위해 mocking Repository를 생성한다.
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

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
          useValue: mockRepository,
        },
        // Jwt Service를 불러온다.
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  // 유저 서비스가 존재하는지 확인.
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.todo('createAccount');
  it.todo('login');
  it.todo('findById');
  it.todo('editProfile');
});
