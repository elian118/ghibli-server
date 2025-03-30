import { Cut } from '../entities/Cut';
import { Arg, Int, Query, Resolver } from 'type-graphql';
import ghibliData from '../data/ghibli';
import { Film } from '../entities/Film';

@Resolver(Cut)
export class CutResolver {
  @Query(() => [Cut])
  cuts(@Arg('filmId', () => Int) filmId: Film['id']): Cut[] {
    return ghibliData.cuts.filter((c: Cut) => c.filmId === filmId);
  }
}
