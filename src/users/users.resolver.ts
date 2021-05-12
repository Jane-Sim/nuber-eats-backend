/**
 * user 리졸버.
 * user 엔티티와 서비스를 주입해서 사용한다.
 */

import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver((of) => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query((returns) => Boolean)
  hi(): boolean {
    return true;
  }

  // 사용자의 계정 유무를 체크하고, 계정 생성 유무를 클라이언트에 전달한다.
  // CreateAccountOutput에 계정 생성 유무, error가 났다면 어떤 이유인지 알려준다.
  @Mutation((returns) => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    try {
      const { ok, error } = await this.usersService.createAccount(
        createAccountInput,
      );
      if (error) {
        return {
          ok,
          error,
        };
      }
      return {
        ok,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  // 로그인시 사용하는 login Mutation.
  // 유저가 로그인 성공시, token과 ok를 true로 전달한다.
  @Mutation((returns) => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    try {
      return this.usersService.login(loginInput);
    } catch (error) {
      return {
        ok: false,
        error: error,
      };
    }
  }

  // 현재 유저 정보를 가져오는 query.
  // 해당 query가 실행될 때, middleware에서 토큰 값으로 user 데이터를 request에 넣고,
  // Guard 에서 request context에 접근 후, 해당 유저 데이터가 존재할 때 me함수를 실행시킨다.
  // guard 에서 증명이 되면, @AuthUser 데코레이터를 통해 user 정보를 request context에서 꺼내온다.
  @Query((returns) => User)
  @UseGuards(AuthGuard)
  me(@AuthUser() authUser: User): User {
    return authUser;
  }
}
