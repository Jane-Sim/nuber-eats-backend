/**
 * 사용자의 login Output dto.
 *
 * LoginOutput: 사용자가 로그인시, 로그인 유무/ 로그인 성공 시, 생성된 토큰을 반환한다.
 * LoginInput: 사용자가 로그인에 필요한 email, password dto를 User entity에서 가져온다.
 */

import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class LoginInput extends PickType(User, ['email', 'password']) {}

@ObjectType()
export class LoginOutput extends CoreOutput {
  @Field(() => String, { nullable: true })
  token?: string;
}
