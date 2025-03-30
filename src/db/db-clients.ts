import { DataSource } from 'typeorm';
import User from '../entities/User';

export const createDB = async (): Promise<DataSource> => {
  const dataSource = new DataSource({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    logging: process.env.NODE_ENV !== 'production',
    synchronize: true, // entities 명시된 데이터 모델들을 DB에 자동 동기화
    entities: [User], // entities 폴더의 모든 데이터 모델이 위치
  });

  return dataSource.initialize();
};
