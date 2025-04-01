import { Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CutVote } from './CutVote';

@ObjectType()
@Entity()
export default class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field({ description: '사용자 이름' })
  @Column({ unique: true, comment: '사용자 이름' })
  username: string;

  @Field({ description: '사용자 이메일' })
  @Column({ unique: true, comment: '사용자 이메일' })
  email: string;

  @Column({ comment: '비밀번호' })
  password: string;

  @Field(() => String, { description: '생성 일자' })
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String, { description: '수정 일자' })
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CutVote, (cutVote) => cutVote.user)
  cutVotes: CutVote[];
}
