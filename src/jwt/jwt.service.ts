import { Inject, Injectable } from '@nestjs/common';
import { JwtModuleOptions } from './jwt.interfaces';
import { CONFIG_OPTIONS } from './jwt.constants';

// jwt 서비스는, 다이나믹 모듈인 JwtModule에서 지정한 프로바이더를 주입해서 바로 사용 가능하다.
@Injectable()
export class JwtService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions,
  ) {}
  hello(): void {
    console.log('hello');
  }
}
