import { FieldResolver, Query, Resolver, Root } from 'type-graphql';
import { Film } from '../entities/Film';
import ghibliData from '../data/ghibli';
import { Director } from '../entities/Director';

@Resolver(Film)
export class FilmResolver {
  @Query(() => [Film])
  films(): Film[] {
    return ghibliData.films;
  }

  @FieldResolver(() => Director, { nullable: true })
  director(@Root() parentFilm: Film): Director | undefined {
    return ghibliData.directors.find((dr) => dr.id === parentFilm.id);
  }
}
