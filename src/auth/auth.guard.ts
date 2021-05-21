/**
 * nestjs의 Guard는, request가 실행될 때마다, 해당 path에서 특정 조건이 일치할 떄만
 * 해당 경로를 처리할 수 있도록 경비한다.
 * AuthGuard는 사용자의 토큰 값으로 가져온 유저 데이터가 존재할 때만 해당 경로를 실행한다.
 * middleware가 실행된 후, guard가 실행된다.
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { AllowedRoles } from './role.decorator';

// CanActivate는 함수. true를 반환하면 request를 진행. false면 request가 멈춘다.
// CanActivate가 ExecutionContext를 통해 request의 context에 접근한다.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // @Role에서 지정한 역할의 문자열들을 불러온다.
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
    const user: User = gqlContext['user'];
    // user가 없으면, 로그인하지 않은 private한 요청에 접근을 못하기에 false를 반환한다.
    if (!user) {
      return false;
    }
    // 만약 로그인한 유저가 어떤 역할이 필요없는 public한 요청이면, true를 반환한다.
    if (role.includes('Any')) {
      return true;
    }
    // 해당 유저가 @Role에서 지정한 역할 중, 일치하는 역할을 갖고 있다면, true를 반환한다.
    return role.includes(user.role);
  }
}
