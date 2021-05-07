/**
 * user 리졸버.
 * user 엔티티와 서비스를 주입해서 사용한다.
 */

import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
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
}
