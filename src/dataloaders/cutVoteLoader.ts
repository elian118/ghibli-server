import { Cut } from '../entities/Cut';
import DataLoader from 'dataloader';
import { CutVote } from '../entities/CutVote';
import { In } from 'typeorm';

type CutVoteKey = {
  cutId: Cut['id'];
};

export const createCutVoteLoader = (): DataLoader<CutVoteKey, CutVote[]> => {
  // 배치 로딩 함수 생성
  return new DataLoader<CutVoteKey, CutVote[]>(async (keys) => {
    const cutIds = keys.map((key) => key.cutId);
    const votes = await CutVote.find({ where: { cutId: In(cutIds) } });
    return keys.map((key) => votes.filter((vote) => vote.cutId === key.cutId));
  });
};
