/**
 * typeOrm의 custom Repository.
 * Repository를 상속받아서, 원하는 메소드명으로 자주 사용하는 DB 쿼리 로직을 생성해서 사용가능하다.
 */
import { EntityRepository, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@EntityRepository(Category)
export class CategoryRepository extends Repository<Category> {
  // 카테코리를 반환하는 메서드.
  // 만약 DB에 없는 카테고리를 사용하려는 경우, DB에 저장 후 카테고리를 반환한다.
  async getOrCreate(name: string): Promise<Category> {
    // trim: 문자열 양 끝 공백 제거. toLowerCase: 소문자로 변경.
    // categoryName을 owner마다 다르게 적을 수 있으니, 비슷한 이름으로 저장되도록 포맷 진행.
    const categoryName = name.trim().toLowerCase();
    // 카테고리 페이지의 URL 경로를 표시하는 slug를 저장. 공백마다 "-" 표시.
    const categorySlug = categoryName.replace(/ /g, '-');

    // 먼저, owner가 지정한 카테고리가 존재하는지 확인한 다음,
    let category = await this.findOne({ slug: categorySlug });
    // 없는 카테고리면, 카테고리를 생성하고, 저장한다.
    if (!category) {
      category = await this.save(
        this.create({ slug: categorySlug, name: categoryName }),
      );
    }
    return category;
  }
}
