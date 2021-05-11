/**
 * 사용자의 request header에 있는 토큰 값을 꺼내와, 유저를 반환하는 middleware.
 * 토큰의 서명과 옵션 값이 일치하면, 클라이언트에 유저를 전달한다.
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { UsersService } from 'src/users/users.service';
import { JwtService } from './jwt.service';

@Injectable()
export class jwtMiddleware implements NestMiddleware {
  // dependency injection 을 통해, jwt/user service를 사용한다.
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    // 헤더에 지정해놓은 토큰이 있다면,
    if ('x-jwt' in req.headers) {
      const token = req.headers['x-jwt'];
      // 해당 토큰이 생성했던 토큰 값과 정확한지 유효성을 확인한다.
      // 맞다면 해당 토큰의 id 값을 통해 유저를 반환한다.
      const decoded = this.jwtService.verify(token.toString());
      //
      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        try {
          console.log(decoded);
          const user = await this.userService.findById(decoded['id']);
          req['user'] = user;
        } catch (error) {}
      }
    }
    // next handler가 request를 받을 예정.
    next();
  }
}
