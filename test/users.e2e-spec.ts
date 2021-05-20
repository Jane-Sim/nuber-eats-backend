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

describe('UserModule (e2e)', () => {
  let app: INestApplication;

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
    const EMAIL = 'ssiox3@gmail.com';

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
            email:"${EMAIL}",
            password:"12345",
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
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
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
          email:"${EMAIL}",
          password:"12345",
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
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toEqual(expect.any(String));
        });
    });
  });

  it.todo('userProfile');
  it.todo('login');
  it.todo('verifyEmail');
  it.todo('me');
  it.todo('editProfile');
});
