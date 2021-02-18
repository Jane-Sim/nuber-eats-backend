import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantsModule } from './restaurants/restaurants.module';

@Module({
  imports: [
    // NestJS의 config 설정을 통해 dotenv로 환경변수 파일인(.env)를 사용한다.
    // isGlobal은 어디서나 config 모듈에 접근 가능옵션, envFilePath는 .env파일의 경로.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
    }),
    // TypeORM과 postgres의 드라이버 설정을 한다.
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'hongsimi',
      password: 'test',
      database: 'nuber-eats',
      synchronize: true,
      logging: true,
    }),
    // code first로 graphql의 schema파일을 자동생성하는 기능.
    GraphQLModule.forRoot({
      autoSchemaFile: true,
    }),
    RestaurantsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
