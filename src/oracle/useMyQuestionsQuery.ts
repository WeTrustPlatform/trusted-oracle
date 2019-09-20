import React from 'react';
import { useAsync } from 'react-use';

import { useWeb3 } from '../ethereum/Web3Provider';
import { NewQuestionEvent, OracleEventType } from '../oracle/OracleData';
import { useOracle } from '../oracle/OracleProvider';
import { Question } from '../oracle/Question';
import { AsyncResult } from '../types/AsyncResult';
import { useStore } from './StoreProvider';

export const useMyQuestionsQuery = () => {
  const { account } = useWeb3();
  const { realitio, initialBlockNumber } = useOracle();
  const { getManyByIds } = useStore();
  const [result, setResult] = React.useState<AsyncResult<Question[]>>({
    loading: true,
    data: [],
  });

  useAsync(async () => {
    const events = (await realitio.getPastEvents(
      OracleEventType.LogNewQuestion,
      {
        fromBlock: initialBlockNumber,
        toBlock: 'latest',
        filter: { user: account },
      },
    )) as NewQuestionEvent[];

    const questions = await getManyByIds(
      events.map(event => event.args.question_id),
    );

    setResult({ data: questions, loading: false });
  }, [realitio, initialBlockNumber, getManyByIds, account]);

  return result;
};
