import { uniqBy } from 'lodash';
import React from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { useWeb3 } from '../ethereum/Web3Provider';
import { AsyncResult } from '../types/AsyncResult';
import { NewAnswerEvent, OracleEventType } from './OracleData';
import { useOracle } from './OracleProvider';
import { INITIAL_BLOCKS, Question } from './Question';
import { useFetchQuestionQuery } from './useQuestionQuery';

const useFetchMyAnswersQuery = () => {
  const { networkId, account } = useWeb3();
  const { realitio } = useOracle();
  const fetchQuestion = useFetchQuestionQuery();
  const initialBlock = INITIAL_BLOCKS[networkId];

  const [_, fetch] = useAsyncFn(async () => {
    if (!realitio) return [];

    const events = (await realitio.getPastEvents(OracleEventType.LogNewAnswer, {
      fromBlock: initialBlock,
      toBlock: 'latest',
      filter: { user: account },
    })) as NewAnswerEvent[];

    const uniqueEvents = uniqBy(events, event => event.args.question_id);

    const questions = (await Promise.all(
      uniqueEvents.map(async event => fetchQuestion(event.args.question_id)),
    )).filter(Boolean) as Question[];

    return questions;
  }, [realitio]);

  return fetch;
};

export const useMyAnswersQuery = () => {
  const fetchMyAnswers = useFetchMyAnswersQuery();
  const [result, setResult] = React.useState<AsyncResult<Question[]>>({
    loading: true,
    data: [],
  });

  useAsync(async () => {
    const value = await fetchMyAnswers();

    setResult({ data: value, loading: false });
  }, [fetchMyAnswers]);

  return result;
};
