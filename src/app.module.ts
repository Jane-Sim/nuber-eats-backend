import { Module } from '@nestjs/common';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { JwtModule } from './jwt/jwt.module';
import { Verification } from './users/entities/verification.entity';
import { MailModule } from './mail/mail.module';
import { Restaurant } from './restaurants/entities/restaurant.entity';
import { Category } from './restaurants/entities/category.entity';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { AuthModule } from './auth/auth.module';
import { Dish } from './restaurants/entities/dish.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { CommonModule } from './common/common.module';
import { PaymentsModule } from './payments/payments.module';
import { Payment } from './payments/entities/payment.entity';
import { ScheduleModule } from '@nestjs/schedule';

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
        NODE_ENV: Joi.string().valid('dev', 'prod', 'test').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        SECRET_KEY: Joi.string().required(),
        MAILGUN_API_KEY: Joi.string().required(),
        MAILGUN_DOMAIN_NAME: Joi.string().required(),
        MAILGUN_FROM_EMAIL: Joi.string().required(),
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
      logging:
        process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test',
      entities: [
        User,
        Verification,
        Restaurant,
        Category,
        Dish,
        Order,
        OrderItem,
        Payment,
      ],
    }),
    // installSubscriptionHandlers: Subscription을 사용하기 위해, WebSocket을 사용하도록 설정하는 기능.
    // autoSchemaFile: code first버전으로 graphql의 schema파일을 자동생성하는 기능.
    // context: apollo server의 context를 통해 다른 resolver에서 해당 context 파라미터값에 접근 가능.(user)
    GraphQLModule.forRoot({
      installSubscriptionHandlers: true,
      autoSchemaFile: true,
      // request는 HTTP에만 있으며, Websocket은 Connection을 사용한다.
      context: ({ req, connection }) => {
        // HTTP 요청시, request.header의 토큰 값을 context에 추가하며
        // WebSocket 요청시, connection.context의 토큰 값을 graphql context에 token 프로퍼티로 추가한다.
        const TOKEN_KEY = 'x-jwt';
        return {
          token: req ? req.headers[TOKEN_KEY] : connection.context[TOKEN_KEY],
        };
      },
    }),
    // cron 기능 사용을 위해, ScheduleModule을 사용한다.
    ScheduleModule.forRoot(),
    // 다이나믹 모듈인 JwtModule에서 forRoot함수를 통해 정적인 JwtModule을 꺼내오자.
    JwtModule.forRoot({
      secretKey: process.env.SECRET_KEY,
    }),
    UsersModule,
    RestaurantsModule,
    AuthModule,
    OrdersModule,
    CommonModule,
    // mailgun 서비스를 이용할 때 필요한 정보를 forRoot에 담아서 보내기.
    MailModule.forRoot({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN_NAME,
      fromEmail: process.env.MAILGUN_FROM_EMAIL,
    }),
    PaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
