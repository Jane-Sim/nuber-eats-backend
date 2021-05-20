/**
 * database에서 사용되는 category entity.
 *
 * 1개의 category로 다수의 restaurant을 가질 수 있다.
 */
import { Field, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@ObjectType() // nest
@Entity() // typeORM
export class Category extends CoreEntity {
  @Field((type) => String) // nest(gql)
  @Column() // typeORM
  @IsString() // validation
  @Length(5) // validation
  name: string; // nest(typescript)

  @Field((type) => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field((type) => [Restaurant])
  @OneToMany((type) => Restaurant, (restaurant) => restaurant.category)
  restaurants: Restaurant[];
}
