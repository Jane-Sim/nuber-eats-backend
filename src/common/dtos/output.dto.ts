/**
 * 공통으로 사용하는 Mutation 전용 Output dto.
 * ok와 error를 반환한다.
 */

import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MutationOutput {
  @Field((type) => String, { nullable: true })
  error?: string;

  @Field((type) => Boolean)
  ok: boolean;
}
