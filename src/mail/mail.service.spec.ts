import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailService } from './mail.service';
import got from 'got';
import * as FormData from 'form-data';

// got, form-data의 npm 모듈의 모든 함수들을 mocking한다.
jest.mock('got');
jest.mock('form-data');

const TEST_DOMAIN = 'test-domain';

describe('MailService', () => {
  let service: MailService;

  // MailService와 메일을 보내는데 필요한 CONFIG_OPTION을 설정한다.
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiKey: 'test-apiKey',
            domain: TEST_DOMAIN,
            fromEmail: 'test-fromEmail',
          },
        },
      ],
    }).compile();
    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // email을 보내기 위해, sendEmail 함수를 실행시키는  테스트.
  describe('sendVerificationEmail', () => {
    it('should call sendEmail', () => {
      const sendVerificationEmailArgs = {
        email: 'email',
        code: 'email',
      };
      // spyOn: 원하는 function을 호출했을 때, 그 콜을 가로채서(intercept)
      // 나만의 구현(implementation) 등의 추가 가능.
      // mockImplementation: 원하는 함수를 전부 재구현하는 가능.
      jest.spyOn(service, 'sendEmail').mockImplementation(async () => true);
      // 이메일과 code 변수와 함께 호출한다.
      service.sendVerificationEmail(
        sendVerificationEmailArgs.email,
        sendVerificationEmailArgs.code,
      );
      // sendEmail이 제목과 템플릿, 변수들과 함께 호출되는지 확인.
      expect(service.sendEmail).toHaveBeenCalledTimes(1);
      expect(service.sendEmail).toHaveBeenCalledWith(
        'Verify Your Email',
        'nubereatsverifyemail',
        [
          { key: 'code', value: sendVerificationEmailArgs.code },
          { key: 'username', value: sendVerificationEmailArgs.email },
        ],
      );
    });
  });

  // got api 를 이용하여 mailgun을 통해 이메일을 보내는 테스트
  describe('sendEmail', () => {
    it('sends email', async () => {
      const result = await service.sendEmail('', '', [
        { key: 'attr', value: 'attrValue' },
      ]);
      // FormData의 append를 Mocking한다. 모의 함수로 생성
      const formSpy = jest.spyOn(FormData.prototype, 'append');
      expect(formSpy).toHaveBeenCalled();
      // moking한 got의 post 함수에서 url 주소와 object 가 함께 호출되었는지 확인.
      expect(got.post).toHaveBeenCalledTimes(1);
      expect(got.post).toHaveBeenCalledWith(
        `https://api.mailgun.net/v3/${TEST_DOMAIN}/messages`,
        expect.any(Object),
      );
      expect(result).toEqual(true);
    });

    // moking한 got의 post 함수의 반환 값을 error로 설정한다.
    it('fails on error', async () => {
      jest.spyOn(got, 'post').mockImplementation(() => {
        throw new Error();
      });
      const result = await service.sendEmail('', '', []);
      expect(result).toEqual(false);
    });
  });
});
