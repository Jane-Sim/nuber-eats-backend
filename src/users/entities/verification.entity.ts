/**
 * user의 검증 정보를 담는 entity.
 * User와 one-to-one 관계를 갖는다.
 */
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CoreEntity {
  @Column()
  @Field((type) => String)
  code: string;

  // OneToOne 데코레이터를 통해, DB에서 User와의 onetoone 관계를 표시하고,
  // JoinColumn 데코레이터를 통해, DB에서 UserId 외래 키 column을  갖게된다.
  @OneToOne((type) => User)
  @JoinColumn()
  user: User;
}
