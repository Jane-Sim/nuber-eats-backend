/**
 * user 모듈의 resolver들을 테스트하는 e2e test.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Verification } from 'src/users/entities/verification.entity';
import { send } from 'process';

// got 라이브러리의 request를 mock 함수로 생성한다.
jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';

// 테스트에 사용되는 test 유저 데이터.
const testUser = {
  email: 'ssiox3@gmail.com',
  password: '12345',
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;
  // 로그인 시, 할당되어 특정 테스트에 사용될 token 변수.
  let jwtToken: string;

  // 공통으로 사용되는 request base 코드
  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  // 로그인하지 않아도 되는 public request
  const publicTest = (query: string) => baseTest().send({ query });
  // 로그인이 필요한 private request
  const privateTest = (query: string) =>
    baseTest().set('X-JWT', jwtToken).send({ query });

  // 테스트 전, app 모듈을 가져와 실행한다.
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  // 테스트 후 DB의 테이블을 drop하고, app 모듈을 종료시킨다.
  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });

  // 새 유저를 만드는 테스트
  describe('createAccount', () => {
    // 유저 생성완료 테스트
    it('should create account', () => {
      // graphql 경로에 쿼리문을 날린다.
      // expect를 통해 graphql의 return 값을 확인 가능하다.
      return publicTest(`
        mutation {
          createAccount(input: {
            email:"${testUser.email}",
            password:"${testUser.password}",
            role:Client
          }) {
            ok,
            error,
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.createAccount;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    // 위에서 생성한 유저 정보로 다시 유저를 만들 때, 유저중복 에러테스트
    it('should fail if account already exists', () => {
      return publicTest(`
      mutation {
        createAccount(input: {
          email:"${testUser.email}",
          password:"${testUser.password}",
          role:Client
        }) {
          ok,
          error,
        }
      }
      `)
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.createAccount;
          expect(ok).toBe(false);
          expect(error).toEqual(expect.any(String));
        });
    });
  });

  // 로그인 테스트
  describe('login', () => {
    // 로그인 성공 테스트
    it('should login with correct credentials', () => {
      return publicTest(`
        mutation {
          login(input: {
            email:"${testUser.email}",
            password:"${testUser.password}",
          }) {
            ok,
            error,
            token
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          // 로그인시, 받아온 token을 jwtToken변수에 할당하여 다른 테스트에 사용한다.
          jwtToken = login.token;
        });
    });

    // 로그인 실패 테스트
    it('should not be able to login with wrong credentials', () => {
      return publicTest(`
      mutation {
        login(input: {
          email:"${testUser.email}",
          password:"xxx",
        }) {
          ok,
          error,
          token
        }
      }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(false);
          expect(login.error).toBe('Wrong password');
          expect(login.token).toBe(null);
        });
    });
  });

  // 유저 데이터를 가져오는 테스트
  describe('userProfile', () => {
    let userId: number;
    // DB에서 1개만 생성된 유저의 id 값을 userId 변수에 할당한다.
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });

    // 유저를 잘 가져왔을 때
    it("should see a user's profile", () => {
      return privateTest(`
        {
          userProfile(userId:${userId}) {
           ok
           error
           user{
             id
           }
         }
       } 
      `)
        .expect(200)
        .expect((res) => {
          const {
            ok,
            error,
            user: { id },
          } = res.body.data.userProfile;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });

    // 유저를 못 가져왔을 때
    it('should not find a profile', () => {
      return privateTest(`
        {
          userProfile(userId:777) {
           ok
           error
           user{
             id
           }
         }
       } 
      `)
        .expect(200)
        .expect((res) => {
          const { ok, error, user } = res.body.data.userProfile;
          expect(ok).toBe(false);
          expect(error).toBe('User Not Found');
          expect(user).toBe(null);
        });
    });
  });

  // 현재 로그인된 유저 자신의 데이터를 가져오는 테스트
  describe('me', () => {
    // 자신의 데이터를 찾아왔을 때
    it('should find my profile', () => {
      return privateTest(`
            {
              me {
                email
              }
            }
      `)
        .expect(200)
        .expect((res) => {
          const { email } = res.body.data.me;
          expect(email).toBe(testUser.email);
        });
    });

    // 토큰 값이 없어서 데이터 찾기 실패시
    it('should not allow logged out user', () => {
      return publicTest(`
            {
              me {
                email
              }
            }
      `)
        .expect(200)
        .expect((res) => {
          const { errors } = res.body;
          const [error] = errors;
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });

  // 유저의 이메일, 패스워드 정보를 변경하는 테스트
  describe('editProfile', () => {
    const NEW_EMAIL = 'ssiox@naver.com';

    // 이메일만 변경
    it('should change email', () => {
      return privateTest(`
            mutation{
              editProfile(input:{
                email: "${NEW_EMAIL}"
             }) {
               ok
               error
             } 
           }
          `)
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.editProfile;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    // 변경된 이메일로 데이터가 잘 불러오지는지 확인
    it('should have new email', () => {
      return privateTest(`
        {
          me {
            email
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const { email } = res.body.data.me;
          expect(email).toBe(NEW_EMAIL);
        });
    });
  });

  // 변경한 이메일로 검증하는 테스트
  describe('verifyEmail', () => {
    // 사용자의 검증코드를 할당할 변수
    let verificationCode: string;

    // 현재 사용자의 검증 코드를 불러오자.
    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
    });
    // 해당 유저의 검증 코드를 통해 검증
    it('should verify email', () => {
      return privateTest(`
        mutation {
          verifyEmail(input: {
            code:"${verificationCode}"
          }){
            ok
            error}
        }
        `)
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.verifyEmail;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    // 해당 유저의 잘못된 검증 코드를 통해 검증 실패
    it('should fail on wrong verification code not found', () => {
      return privateTest(`
        mutation {
          verifyEmail(input: {
            code:"0000"
          }){
            ok
            error}
        }
        `)
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.verifyEmail;
          expect(ok).toBe(false);
          expect(error).toBe('Verification not found.');
        });
    });
  });
});
