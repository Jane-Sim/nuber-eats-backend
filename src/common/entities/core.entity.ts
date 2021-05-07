// entity들의 자주 사용되는 속성 값을 모아놓는 core entity
// 데이터의 id 갑소가, 생성날짜, 업데이트 날짜 등을 저장한다.

import { Field } from '@nestjs/graphql';
import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class CoreEntity {
  @PrimaryGeneratedColumn()
  @Field((type) => Number)
  id: number;

  @CreateDateColumn()
  @Field((type) => Date)
  createAt: Date;

  @UpdateDateColumn()
  @Field((type) => Date)
  updateAt: Date;
}
