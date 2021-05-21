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
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';

// 사용자의 권한을 사용하는 enum
enum UserRole {
  Client,
  Owner,
  Delivery,
}

// 위에서 만든 UserRole enum을 graphql에서 사용하기 위해서는
// registerEnumType 을 사용해서 graphql enum에 등록해야 한다.
registerEnumType(UserRole, { name: 'UserRole' });

// InputType과 ObjectType의 name이 겹치지 않도록, InputType에 name을 지정하여 사용한다.
// schema에는 DB에서 인식할 수 있는 User type과
// graphql, DB에서 인식 가능한 UserInputType이 생성된다.
@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  // email을 기준으로 중복되지 않도록 unique 설정
  @Column({ unique: true })
  @Field((type) => String)
  @IsEmail()
  email: string;

  // password가 BeforeUpdate 데코레이터로 무분별하게 hashing되기에,
  // find/findOne으로 user를 찾을 시, password 속성 값을 제외하고 User Entity를 전달한다.
  @Column({ select: false })
  @Field((type) => String)
  @IsString()
  password: string;

  @Field((type) => UserRole)
  @Column({ type: 'enum', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: false })
  @Field((type) => Boolean)
  @IsBoolean()
  verified: boolean;

  // 1명의 오너는 다수의 레스토랑을 지닌다.
  @Field((type) => [Restaurant])
  @OneToMany((type) => Restaurant, (restaurant) => restaurant.owner)
  restaurants: Restaurant[];

  // typeorm에서 제공하는 Entity Listeners and Subscribers중 하나인
  // @BeforeInsert() 데코레이터를 이용하여, typeorm이 db에 데이터를 저장하기 전에,
  // Repository.save() 함수 실행 전에, password 속성 값을 해싱한다.
  // @BeforeUpdate() 데코레이터를 이용해서, typeorm이 db에 업데이트 하기 전에, 변경된 password 속성 값을 해싱한다.
  // @BeforeUpdate() 는 특정 entity를 update 해야 실행되기에, typeOrm의 save 함수로 실행해야 발동한다.
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    // 사용자의 password가 select로 불러왔을 경우에만, hashing한다.
    if (this.password) {
      try {
        // bcrypt.hash 함수에 해싱시킬 데이터와, round 값을 넘긴다. (round default = 10)
        // salt round는 해싱 계산 횟수를 뜻한다. 값이 높을 수록 계산 수 up. ex) 2^10 = 1000회
        this.password = await bcrypt.hash(this.password, 10);
      } catch (error) {
        throw new InternalServerErrorException();
      }
    }
  }

  // 현재 비밀번호와 사용자가 로그인시 보내는 비밀번호가 맞는지 체크하는 함수.
  // bcrypt의 compare를 통해서 비밀번호를 확인 후 boolean으로 전달한다.
  async checkPassword(aPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(aPassword, this.password);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
