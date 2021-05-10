import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

// app.module에서 설정한 configModule의 값들을 ConfigService를 통해 꺼내올 수 있다.
// UsersService에서 사용할 수 있도록 import에 ConfigService를 추가한다.
@Module({
  imports: [TypeOrmModule.forFeature([User]), ConfigService],
  providers: [UsersResolver, UsersService],
})
export class UsersModule {}
