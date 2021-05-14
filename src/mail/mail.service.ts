/**
 * mail service.
 */
import { Inject, Injectable } from '@nestjs/common';
import got from 'got';
import * as FormData from 'form-data';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { EmailVar, MailModuleOptions } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  // got 라이브러리를 통해, http 통신을 진행한다.
  // mailgun의 curl 통신을 위해, 아래와 같이 도메인을 통해 메일을 보낸다.
  // header에 들어가는 api 값은 base64로 인코딩 후 보내야한다.
  private async sendEmail(
    subject: string,
    template: string,
    emailVars: EmailVar[],
  ) {
    const form = new FormData();
    // mailgun의 도메인을 통해 이메일 주소를 지정한다
    // [보내는 사람 별명Jane from Nuber Eats] [도메인 주소<mailgun@${this.options.domain}>]
    form.append(
      'from',
      `Jane from Nuber Eats <mailgun@${this.options.domain}>`,
    );
    // 받는 유저의 이메일을 지정한다.
    form.append('to', 'ssiox@naver.com');
    // 메일 제목
    form.append('subject', subject);
    // 원하는 이메일 템플릿을 지정한다.
    form.append('template', template);
    // v: 를 통해, 변수 값을 전송할 수 있다. user 변수는 v:user
    // emailVars 배열을 통해 여러 변수를 formData에 추가한다.
    emailVars.forEach((eVar) => form.append(`v:${eVar.key}`, eVar.value));
    // curl 형식으로 아래와 같이 보낸다.
    try {
      const response = await got(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.options.apiKey}`,
            ).toString('base64')}`,
          },
          body: form,
        },
      );
    } catch (error) {
      console.log(error);
    }
  }

  // public한 sendVerificationEmail 함수를 통해
  // private한 sendEmail 함수를 사용한다.
  sendVerificationEmail(email: string, code: string): void {
    this.sendEmail('Verify Your Email', 'nubereatsverifyemail', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }
}
