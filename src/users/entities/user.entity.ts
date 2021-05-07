// user의 entity. core entity를 상속받아서 사용한다.

import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity } from 'typeorm';

// 사용자의 권한을 사용하는 enum
enum UserRole {
  Client,
  Owner,
  Delivery,
}

// 위에서 만든 UserRole enum을 graphql에서 사용하기 위해서는
// registerEnumType 을 사용해서 graphql enum에 등록해야 한다.
registerEnumType(UserRole, { name: 'UserRole' });

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column()
  @Field((type) => String)
  email: string;

  @Column()
  @Field((type) => String)
  password: string;

  @Field((type) => UserRole)
  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;
}
