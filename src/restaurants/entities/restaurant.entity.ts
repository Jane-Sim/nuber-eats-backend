/**
 * database에서 사용되는 Restaurant entity.
 *
 * GraphQL의 스키마 타입을 위한 ObjectType 데코레이터.
 * Field 데코레이터로, entity의 Type, nullable 등 설정.
 * 해당 Restaurant entity를 Graphql 스키마로 생성.
 *
 * TypeORM의 Entity 데코레이터를 이용하여, DB에 저장되는 데이터 형식 설정.
 * 설정한 Entity, Column 데코레이터를 이용해
 * 해당 Restaurant entity를 연결한 DB에 테이블을 생성.
 */
import { Field, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Category } from './category.entity';

@ObjectType() // nest
@Entity() // typeORM
export class Restaurant extends CoreEntity {
  @Field((type) => String) // nest(gql)
  @Column() // typeORM
  @IsString() // validation
  @Length(5) // validation
  name: string; // nest(typescript)

  @Field((type) => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field((type) => String, { defaultValue: '강남' })
  @Column()
  @IsString()
  address: string;

  @Field((type) => Category)
  @ManyToOne((type) => Category, (category) => category.restaurants)
  category: Category;
}
