import { DynamicModule, Global, Module } from '@nestjs/common';
import { JwtService } from './jwt.service';

// DynamicModule은 또 다른 module을 반환하는 module이다.
// forRoot는 DynamicModule 값을 반환한다.
// Dynamic jwt 모듈을 어디서든 사용할 수 있도록, Global 데코레이터를 사용한다.
@Module({})
@Global()
export class JwtModule {
  static forRoot(): DynamicModule {
    return {
      module: JwtModule,
      exports: [JwtService],
      providers: [JwtService],
    };
  }
}
