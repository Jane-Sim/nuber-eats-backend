/**
 * database에서 사용되는 category entity.
 *
 * 1개의 category로 다수의 restaurant을 가질 수 있다.
 */
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Restaurant } from './restaurant.entity';

// InputType과 ObjectType의 name이 겹치지 않도록, InputType에 name을 지정하여 사용한다.
// schema에는 DB에서 인식할 수 있는 Category type과
// graphql, DB에서 인식 가능한 CategoryInputType이 생성된다.
@InputType('CategoryInputType', { isAbstract: true })
@ObjectType() // nest
@Entity() // typeORM
export class Category extends CoreEntity {
  @Field((type) => String) // nest(gql)
  @Column({ unique: true }) // typeORM
  @IsString() // validation
  @Length(5) // validation
  name: string; // nest(typescript)

  @Field((type) => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  coverImg?: string;

  @Field((type) => String)
  @Column({ unique: true })
  @IsString()
  slug: string;

  // category foreign key를 가진 restaurant을 가져올 수 있도록 관계형 추가.
  @Field((type) => [Restaurant], { nullable: true })
  @OneToMany((type) => Restaurant, (restaurant) => restaurant.category)
  restaurants?: Restaurant[];
}
