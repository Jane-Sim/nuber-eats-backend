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
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType() // nest
@Entity() // typeORM
export class Restaurant {
  @PrimaryGeneratedColumn() // typeORM
  @Field((type) => Number) // nest(gql)
  id: number; // nest(typescript)

  @Field((type) => String) // nest(gql)
  @Column() // typeORM
  @IsString() // validation
  @Length(5) // validation
  name: string; // nest(typescript)

  // isVegan의 graphql 기본 값은 true, db칼럼에서도 dafault값은 true.
  // IsOptional을 통해 속성 값이 옵션이며, 값이 있다면 boolean으로 설정하라
  @Field((type) => Boolean, { defaultValue: true }) // nest(gql)
  @Column({ default: true }) // typeORM
  @IsOptional() // validation
  @IsBoolean() // validation
  isVegan: boolean; // nest(typescript)

  @Field((type) => String, { defaultValue: '강남' })
  @Column()
  @IsString()
  address: string;

  @Field((type) => String)
  @Column()
  @IsString()
  ownersName: string;

  @Field((type) => String)
  @Column()
  @IsString()
  categoryName: string;
}
