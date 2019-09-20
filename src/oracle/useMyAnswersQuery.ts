import { uniqBy } from 'lodash';
import React from 'react';
import { useAsync } from 'react-use';

import { useWeb3 } from '../ethereum/Web3Provider';
import { AsyncResult } from '../types/AsyncResult';
import { NewAnswerEvent, OracleEventType } from './OracleData';
import { useOracle } from './OracleProvider';
import { Question } from './Question';
import { useStore } from './StoreProvider';

export const useMyAnswersQuery = () => {
  const { account } = useWeb3();
  const { getManyByIds } = useStore();
  const { realitio, initialBlockNumber } = useOracle();
  const [result, setResult] = React.useState<AsyncResult<Question[]>>({
    loading: true,
    data: [],
  });

  useAsync(async () => {
    const events = (await realitio.getPastEvents(OracleEventType.LogNewAnswer, {
      fromBlock: initialBlockNumber,
      toBlock: 'latest',
      filter: { user: account },
    })) as NewAnswerEvent[];

    const uniqueEvents = uniqBy(events, event => event.args.question_id);

    const questions = await getManyByIds(
      uniqueEvents.map(event => event.args.question_id),
    );

    setResult({ data: questions, loading: false });
  }, [realitio, initialBlockNumber, getManyByIds, account]);

  return result;
};
