import { Query, Resolver } from 'type-graphql';
import { Film } from '../entities/Film';
import ghibliData from '../data/ghibli';

@Resolver(Film)
export class FilmResolver {
  @Query(() => [Film])
  films(): Film[] {
    return ghibliData.films;
  }
}
