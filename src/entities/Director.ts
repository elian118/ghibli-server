import { Field, Int, ObjectType } from 'type-graphql';

@ObjectType()
export class Director {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;
}
