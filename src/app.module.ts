import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { CommonModule } from './common/common.module';
import { JwtModule } from './jwt/jwt.module';
import { jwtMiddleware } from './jwt/jwt.middleware';

@Module({
  imports: [
    // NestJS의 config 설정을 통해 dotenv로 환경변수 파일인(.env)를 사용한다.
    // isGlobal은 어디서나 config 모듈에 접근 가능옵션, envFilePath는 .env파일의 경로.
    // ignoreEnvFile은 서버에 deploy시, .env파일의 사용여부를 설정. prod환경에서만 .env를 사용하지 않는다.
    // validationSchema은 스키마의 유효성검사 옵션. Joi를 통해 각 변수 유효성을 검사가능.
    // SECRET_KEY 는 사용자에게 전달한 json token을 생성할 때 필요한 private key.
    // ConfigModule로 만들어낸 configService는, 어디서든 사용이 가능하다.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'prod').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        SECRET_KEY: Joi.string().required(),
      }),
    }),
    // TypeORM과 postgres의 드라이버 설정을 한다.
    // cross-env로 가져온 .env의 변수값을 가져와 드라이버 설정을 한다.
    // synchronize를 설정하면, 자동으로 graphql의 스키마 생성과, DB에 사용할 테이블을 생성해준다.
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: process.env.NODE_ENV !== 'prod',
      logging: process.env.NODE_ENV !== 'prod',
      entities: [User],
    }),
    // code first로 graphql의 schema파일을 자동생성하는 기능.
    GraphQLModule.forRoot({
      autoSchemaFile: true,
    }),
    // 다이나믹 모듈인 JwtModule에서 forRoot함수를 통해 정적인 JwtModule을 꺼내오자.
    JwtModule.forRoot({
      secretKey: process.env.SECRET_KEY,
    }),
    UsersModule,
    CommonModule,
  ],
  controllers: [],
  providers: [],
})
// AppModule에서 implements로 jwtMiddleware를 사용하는 방법
export class AppModule implements NestModule {
  // module에서는 configure 함수를 사용해야한다.
  configure(consumer: MiddlewareConsumer) {
    // consumer를 통해 jwtMiddleware를 적용하고,
    // 어떤 경로, REST에서만 해당 미들웨어가 동작되는지도 설정 가능하다.
    consumer.apply(jwtMiddleware).forRoutes({
      path: '/graphql',
      method: RequestMethod.ALL,
    });
  }
}
