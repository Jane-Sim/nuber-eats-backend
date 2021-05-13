import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';

// User Service를 테스트할 유닛 테스트
describe('UserService', () => {
  // 서비스를 여러 곳에서 사용할 수 있도록, 전역변수로 빼놓는다.
  let service: UsersService;

  // 테스트를 진행하기 전, 모듈과 서비스를 가져와 지정한다.
  beforeAll(async () => {
    // createTestingModule을 통해, userService만 테스트하는 모듈을 불러온다.
    const module = await Test.createTestingModule({
      providers: [UsersService],
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
