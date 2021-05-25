/**
 * paging시 사용하는 dto.
 */
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from './output.dto';

@InputType()
export class PaginationInput {
  @Field((type) => Int, { defaultValue: 1 })
  page: number;
}

@ObjectType()
export class PaginationOutput extends CoreOutput {
  // paging시, 총 페이지 수.
  @Field((type) => Int, { nullable: true })
  totalPages?: number;

  // 페이징으로 받아온 총 데이터 갯수.
  @Field((type) => Int, { nullable: true })
  totalResults?: number;
}
