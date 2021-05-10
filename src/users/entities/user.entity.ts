// user의 entity. core entity를 상속받아서 사용한다.
// 사용자의 비밀번호는 bcrypt 라이브러리를 이용해서 hash화 시킨다.
import { InternalServerErrorException } from '@nestjs/common';
import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { IsEmail, IsEnum } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, Column, Entity } from 'typeorm';

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
  @IsEmail()
  email: string;

  @Column()
  @Field((type) => String)
  password: string;

  @Field((type) => UserRole)
  @Column({ type: 'enum', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  // typeorm에서 제공하는 Entity Listeners and Subscribers중 하나인
  // @BeforeInsert() 데코레이터를 이용하여, typeorm이 db에 데이터를 저장하기 전에,
  // Repository.save() 함수 실행 전에, password 속성 값을 해싱한다.
  @BeforeInsert()
  async hashPassword(): Promise<void> {
    try {
      // bcrypt.hash 함수에 해싱시킬 데이터와, round 값을 넘긴다. (round default = 10)
      // salt round는 해싱 계산 횟수를 뜻한다. 값이 높을 수록 계산 수 up. ex) 2^10 = 1000회
      this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // 현재 비밀번호와 사용자가 로그인시 보내는 비밀번호가 맞는지 체크하는 함수.
  // bcrypt의 compare를 통해서 비밀번호를 확인 후 boolean으로 전달한다.
  async checkPassword(aPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(aPassword, this.password);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
