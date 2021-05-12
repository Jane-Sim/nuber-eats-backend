/**
 * nestjs의 Guard는, request가 실행될 때마다, 해당 path에서 특정 조건이 일치할 떄만
 * 해당 경로를 처리할 수 있도록 경비한다.
 * AuthGuard는 사용자의 토큰 값으로 가져온 유저 데이터가 존재할 때만 해당 경로를 실행한다.
 * middleware가 실행된 후, guard가 실행된다.
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

// CanActivate는 함수. true를 반환하면 request를 진행. false면 request가 멈춘다.
// CanActivate가 ExecutionContext를 통해 request의 context에 접근한다.
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // ExecutionContext http 형식이기에, graphql 형식의 context를 가져와 사용한다.
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user = gqlContext['user'];
    if (!user) {
      return false;
    }
    return true;
  }
}
