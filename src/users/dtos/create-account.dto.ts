/**
 * user 데이터를 생성하기 위한 CreateAccountInput dto와
 * 생성 유무를 사용자에게 알려주기 위한 CreateAccountOutput dto.
 * CreateAccountOutput은 주로 사용되는 CoreOutput dto를 상속 받는다.
 */
import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class CreateAccountInput extends PickType(User, [
  'email',
  'password',
  'role',
]) {}

@ObjectType()
export class CreateAccountOutput extends CoreOutput {}
