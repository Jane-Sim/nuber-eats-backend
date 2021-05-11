import { Inject, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtModuleOptions } from './jwt.interfaces';
import { CONFIG_OPTIONS } from './jwt.constants';

// jwt 서비스는, 다이나믹 모듈인 JwtModule에서 지정한 프로바이더를 주입해서 바로 사용 가능하다.
// .env 에 넣은 SECRET_KEY를 가져올 수 있도록, JwtModuleOptions를 활용한다.
@Injectable()
export class JwtService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions,
  ) {}
  sign(userId: number): string {
    // jwt.sign({생성할 토큰에 넣을 데이터}, private key)
    return jwt.sign({ id: userId }, this.options.secretKey);
  }
}
