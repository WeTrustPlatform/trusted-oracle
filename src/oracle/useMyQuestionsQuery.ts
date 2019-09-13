import React from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { useWeb3 } from '../ethereum/Web3Provider';
import { NewQuestionEvent, OracleEventType } from '../oracle/OracleData';
import { useOracle } from '../oracle/OracleProvider';
import { INITIAL_BLOCKS, Question } from '../oracle/Question';
import { useFetchQuestionQuery } from '../oracle/useQuestionQuery';
import { AsyncResult } from '../types/AsyncResult';

const useFetchMyQuestionsQuery = () => {
  const { networkId, account } = useWeb3();
  const { realitio } = useOracle();
  const fetchQuestion = useFetchQuestionQuery();
  const initialBlock = INITIAL_BLOCKS[networkId];

  const [_, fetch] = useAsyncFn(async () => {
    if (!realitio) return [];

    const events = (await realitio.getPastEvents(
      OracleEventType.LogNewQuestion,
      {
        fromBlock: initialBlock,
        toBlock: 'latest',
        filter: { user: account },
      },
    )) as NewQuestionEvent[];

    const questions = await Promise.all(
      events.map(async event => fetchQuestion(event.args.question_id)),
    );

    return questions.filter(Boolean) as Question[];
  }, [realitio]);

  return fetch;
};

export const useMyQuestionsQuery = () => {
  const fetchMyQuestions = useFetchMyQuestionsQuery();
  const [result, setResult] = React.useState<AsyncResult<Question[]>>({
    loading: true,
    data: [],
  });

  useAsync(async () => {
    const value = await fetchMyQuestions();

    setResult({ data: value, loading: false });
  }, [fetchMyQuestions]);

  return result;
};
