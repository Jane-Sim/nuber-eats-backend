import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';

const TEST_KEY = 'testKey';
const USER_ID = 1;

// jest mock을 통해서, 모듈 기능도 속일 수 있다.
// 사용하고자 하는 npm module의 이름을 적은 뒤, 해당 모듈의 함수를 원하는 형식으로 지정하면 된다.
jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => 'TOKEN'),
    verify: jest.fn(() => ({
      id: USER_ID,
    })),
  };
});

describe('JwtService', () => {
  let service: JwtService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        { provide: CONFIG_OPTIONS, useValue: { secretKey: TEST_KEY } },
      ],
    }).compile();
    service = module.get<JwtService>(JwtService);
  });

  // jwt 서비스가 존재하는지 확인.
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 토큰을 생성하는 메서드
  describe('sign', () => {
    it('should return a signed token', () => {
      const token = service.sign(USER_ID);
      // sign이 문자열인 토큰을 반환하는지, 1번 호출되고, id Object와 private key와 함께 호출되는지 확인.
      expect(typeof token).toBe('string');
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith({ id: USER_ID }, TEST_KEY);
    });
  });

  describe('verify', () => {
    it('should return the decode token', () => {
      const TOKEN = 'TOKEN';
      const decodedToken = service.verify(TOKEN);
      expect(decodedToken).toEqual({ id: USER_ID });
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith(TOKEN, TEST_KEY);
    });
  });
});
