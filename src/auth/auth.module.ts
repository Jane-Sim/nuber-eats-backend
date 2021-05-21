import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';

/**
 * APP_GUARD는 nestjs에서 제공하는 constant다.
 * provider에 APP_GUARD constant와 생성한 AuthGuard를 추가하면, 모든 Resolver/controller에서
 * @UseGuards(AuthGuard) 데코레이터를 사용하지 않아도, Guard 기능이 적용된다.
 */

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AuthModule {}
