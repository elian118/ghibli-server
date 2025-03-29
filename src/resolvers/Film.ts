import { Arg, Field, FieldResolver, Int, ObjectType, Query, Resolver, Root } from 'type-graphql';
import { Film } from '../entities/Film';
import ghibliData from '../data/ghibli';
import { Director } from '../entities/Director';

@ObjectType()
class PaginatedFilms {
  @Field(() => [Film])
  films: Film[];

  @Field(() => Int, { nullable: true })
  cursor?: Film['id'] | null;
}

@Resolver(Film)
export class FilmResolver {
  @Query(() => PaginatedFilms)
  films(
    @Arg('limit', () => Int, { nullable: true, defaultValue: 6 })
    limit: number,
    @Arg('cursor', () => Int, { nullable: true, defaultValue: 1 })
    cursor: Film['id'],
  ): PaginatedFilms {
    // 최대 제한 6으로 고정
    const realLimit = Math.min(6, limit);

    // 커서 없으면 빈 배열 반환
    if (!cursor) return { films: [] };

    const cursorDataIdx = ghibliData.films.findIndex((f) => f.id === cursor);
    // 잘못된 커서는 초깃값 반환
    if (cursorDataIdx === -1) return { films: [] };

    const result = ghibliData.films.slice(cursorDataIdx, cursorDataIdx + realLimit);

    // 다음 커서 생성
    const nextCursor = result[result.length - 1].id + 1;
    // 다음 커서 유효성 검사
    const hasNext = ghibliData.films.findIndex((f) => f.id === nextCursor) > -1;
    console.log({
      cursor: hasNext ? nextCursor : null,
      films: result,
    });
    return {
      cursor: hasNext ? nextCursor : null,
      films: result,
    };
  }

  @FieldResolver(() => Director, { nullable: true })
  director(@Root() parentFilm: Film): Director | undefined {
    return ghibliData.directors.find((dr) => dr.id === parentFilm.id);
  }
}
