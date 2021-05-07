/**
 * user 데이터를 생성하기 위한 CreateAccountInput dto와
 * 생성 유무를 사용자에게 알려주기 위한 CreateAccountOutput dto.
 */
import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';

@InputType()
export class CreateAccountInput extends PickType(User, [
  'email',
  'password',
  'role',
]) {}

@ObjectType()
export class CreateAccountOutput {
  @Field((type) => String, { nullable: true })
  error?: string;

  @Field((type) => Boolean)
  ok: boolean;
}
