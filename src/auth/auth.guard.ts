/**
 * nestjs의 Guard는, HTTP, WebSocket이 실행될 때마다, 해당 resolver에서 지정한 조건이 일치할 때만
 * 해당 함수(경로)를 처리할 수 있도록 경비한다.
 * AuthGuard는 사용자의 토큰 값으로 가져온 유저 데이터가 존재하거나 해당 유저의 권한이 일치할 경우, 해당 함수를 실행한다.
 * app moduled에서 graphql Context에서 지정한 token 데이터를 가져온 뒤, guard가 실행된다. guard 실행 후 AuthUser class 실행.
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from 'src/jwt/jwt.service';
import { UsersService } from 'src/users/users.service';
import { AllowedRoles } from './role.decorator';

// CanActivate는 함수. true를 반환하면 request를 진행. false면 request가 멈춘다.
// CanActivate가 ExecutionContext를 통해 request의 context에 접근한다.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Roles에서 지정한 역할의 문자열들을 불러온다.
    const role = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );
    // role이 없으면, 로그인 토큰이 필요없는 public한 요청이기에 true를 반환한다.
    if (!role) {
      return true;
    }
    // ExecutionContext http 형식이기에, graphql 형식의 context를 가져와 사용한다.
    const gqlContext = GqlExecutionContext.create(context).getContext();
    // app 모듈에서 graphql context에 넣은 token 프로퍼티를 가져온다.
    const token = gqlContext.token;

    // token이 있을 때, 해당 token이 생성했던 token 값과 정확한지 유효성을 확인한다.
    if (token) {
      const decoded = this.jwtService.verify(token.toString());
      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        // token의 id 값을 통해 유저를 반환한다.
        const { user } = await this.userService.findById(decoded['id']);
        // 유저가 있을 경우, graphql context에 user 프로퍼티로 추가해준다. (AuthUser Class에서 필요.)
        if (user) {
          gqlContext['user'] = user;
          // 만약 로그인한 유저가 어떤 역할이 필요없는 public한 요청이면, true를 반환한다.
          if (role.includes('Any')) {
            return true;
          }
          // 해당 유저가 @Role에서 지정한 역할 중, 일치하는 역할을 갖고 있다면, true를 반환한다.
          return role.includes(user.role);
        }
      }
    }
    // token의 유효성이 이상하거나, 문제가 있을 경우,  false를 반환한다.
    return false;
  }
}
