/**
 * category를 반환하는 dto.
 */
import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Category } from '../entities/category.entity';

@ArgsType()
export class CategoryInput {
  @Field((type) => String)
  slug: string;
}

@ObjectType()
export class CategoryOutput extends CoreOutput {
  @Field((type) => Category, { nullable: true })
  category?: Category;
}
