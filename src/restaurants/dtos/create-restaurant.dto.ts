/**
 * 주고 받는 데이터의 타입을 지정하는 dto.
 * restaurant의 데이터를 생성할 때 사용한다.
 * ArgsType 데코레이터를 통해, 클라이언트가 전달하는 인자 값으로 데이터를 생성.
 * class-validator로 데이터의 유효성 검사를 한다.
 */
import { ArgsType, Field } from '@nestjs/graphql';
import { IsBoolean, IsString, Length } from 'class-validator';

@ArgsType()
export class CreateRestaurantDto {
  @Field((type) => String)
  @IsString()
  @Length(5, 10)
  name: string;

  @Field((type) => Boolean)
  @IsBoolean()
  isVegan: boolean;

  @Field((type) => String)
  @IsString()
  adddress: string;

  @Field((type) => String)
  @IsString()
  ownersName: string;

  @Field((type) => String)
  @IsString()
  categoryName: string;
}
