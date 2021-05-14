/**
 * 메일을 보낼 수 있는 mail module.
 * 다이나믹 모듈로 생성하여, mailgun 서비스 이용에 필요한 option 값을
 * provide로 추가해서 service에서 사용할 수 있다.
 */

import { DynamicModule, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailModuleOptions } from './mail.interfaces';

@Module({})
export class MailModule {
  static forRoot(options: MailModuleOptions): DynamicModule {
    return {
      module: MailModule,
      // 아래처럼 provider는 CONFIG_OPTIONS이라는 이름을 가진 ValueProvider를 제공한다.
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
      ],
      exports: [],
    };
  }
}
