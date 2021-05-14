/**
 * user의 검증 정보를 담는 entity.
 * User와 one-to-one 관계를 갖는다.
 */
import { v4 as uuidv4 } from 'uuid';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CoreEntity {
  @Column()
  @Field((type) => String)
  code: string;

  // OneToOne 데코레이터를 통해, DB에서 User와의 onetoone 관계를 표시하고,
  // onDelete CASCADE 설정을 통해, 가리키고 있는 User 데이터가 삭제되면 해당 Verification 데이터도 같이 삭제한다.
  // JoinColumn 데코레이터를 통해, DB에서 UserId 외래 키 column을  갖게된다.
  @OneToOne((type) => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  // insert 함수가 실행되기 전,
  @BeforeInsert()
  createCode(): void {
    // 고유한 값을 랜덤한 문자로 만들어주는 uuid 함수를 통해 code 값 지정.
    this.code = uuidv4();
  }
}
