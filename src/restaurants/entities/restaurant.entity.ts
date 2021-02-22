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
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field((type) => Number)
  id: number;

  @Field((type) => String)
  @Column()
  name: string;

  @Field((type) => Boolean)
  @Column()
  isVegan: boolean;

  @Field((type) => String)
  @Column()
  address: string;

  @Field((type) => String)
  @Column()
  ownersName: string;

  @Field((type) => String)
  @Column()
  categoryName: string;
}
