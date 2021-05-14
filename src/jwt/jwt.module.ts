import { DynamicModule, Global, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { JwtModuleOptions } from './jwt.interfaces';
import { JwtService } from './jwt.service';

// DynamicModule은 또 다른 module을 반환하는 module이다.
// forRoot는 DynamicModule 값을 반환한다.
// Dynamic jwt 모듈을 어디서든 사용할 수 있도록, Global 데코레이터를 사용한다.
// 정적인 forRoot는 파라미터 값을 받아와서, 다이나믹 모듈을 커스텀 가능하다.
// 다이나믹 모듈의 providers는 [{provide, ClassProvider<T> | ValueProvider<T> | FactoryProvider<T> | ExistingProvider<T>}] 로 지정가능하다.
@Module({})
@Global()
export class JwtModule {
  static forRoot(options: JwtModuleOptions): DynamicModule {
    return {
      module: JwtModule,
      // 아래처럼 provider는 CONFIG_OPTIONS이라는 이름을 가진 ValueProvider를 제공한다.
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        // 위와 같은 [{}] 유형의 프로바이더를 아래와 같이 함축적으로 사용 가능하다.
        JwtService,
        //{ provide: JwtService, useClass: JwtService },
      ],
      exports: [JwtService],
    };
  }
}
