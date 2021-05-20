/**
 * user 모듈의 resolver들을 테스트하는 e2e test.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection } from 'typeorm';

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
  // 로그인 시, 할당되어 특정 테스트에 사용될 token 변수.
  let jwtToken: string;

  // 테스트 전, app 모듈을 가져와 실행한다.
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
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
        `,
        })
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.createAccount;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    // 위에서 생성한 유저 정보로 다시 유저를 만들 때, 유저중복 에러테스트
    it('should fail if account already exists', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
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
      `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
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
        `,
        })
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
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
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
      `,
        })
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

  it.todo('userProfile');
  it.todo('verifyEmail');
  it.todo('me');
  it.todo('editProfile');
});
