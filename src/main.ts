/**
 * NestJs의 application을 실행시키는 파일.
 * main.ts는 이름이 변경이 없어야한다.
 * NestFactory에서 AppModule을 가져와 App을 생성하고,
 * 생성한 app에 ValidationPipe 파이프를 설치하여, 데이터 유효성 검사를 한다.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  //jwtMiddleware 를 app 전체에서 사용하고 싶으면 아래와 같이 쓴다.
  //app.use(jwtMiddleware)
  await app.listen(3000);
}
bootstrap();
