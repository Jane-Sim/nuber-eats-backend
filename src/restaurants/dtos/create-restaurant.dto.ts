/**
 * 주고 받는 데이터의 타입을 지정하는 dto.
 * restaurant의 데이터를 생성할 때 사용한다.
 * Mapped Types을 이용해, Restaurant entity 클래스를 상속받는다.
 * Restaurant의 인자값에서 OmitType인 Mapped Type이 id값을 제외한 속성들을 가져와준다.
 */
import { InputType, OmitType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class CreateRestaurantDto extends OmitType(
  Restaurant,
  ['id'],
  InputType,
) {}
