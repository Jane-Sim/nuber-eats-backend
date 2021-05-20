/**
 * user 리졸버.
 * user 엔티티와 서비스를 주입해서 사용한다.
 */

import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver((of) => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  // 사용자의 계정 유무를 체크하고, 계정 생성 유무를 클라이언트에 전달한다.
  // CreateAccountOutput에 계정 생성 유무, error가 났다면 어떤 이유인지 알려준다.
  @Mutation((returns) => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    return this.usersService.createAccount(createAccountInput);
  }

  // 로그인시 사용하는 login Mutation.
  // 유저가 로그인 성공시, token과 ok를 true로 전달한다.
  @Mutation((returns) => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    return this.usersService.login(loginInput);
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

  // 특정 유저의 프로필을 가져오는 함수.
  @UseGuards(AuthGuard)
  @Query((returns) => UserProfileOutput)
  async userProfile(
    @Args() userProfileInput: UserProfileInput,
  ): Promise<UserProfileOutput> {
    return this.usersService.findById(userProfileInput.userId);
  }

  // 유저 프로필 정보를 수정하는 Mutation.
  // 토큰 값으로 유저 정보를 가져온 뒤, email, password 등 유저가 변경하려는 값이 있으면,
  // 변경하려는 값으로 user entity를 업데이트한다.
  @UseGuards(AuthGuard)
  @Mutation((returns) => EditProfileOutput)
  async editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    return this.usersService.editProfile(authUser.id, editProfileInput);
  }

  // 사용자의 이메일을 통해, 검증 code를 받은 경우,
  // 해당 사용자의 검증 상태를 변경해준다.
  @Mutation((returns) => VerifyEmailOutput)
  async verifyEmail(
    @Args('input') { code }: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    return this.usersService.verifyEmail(code);
  }
}
