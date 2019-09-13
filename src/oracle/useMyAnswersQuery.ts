import { uniqBy } from 'lodash';
import React from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { useWeb3 } from '../ethereum/Web3Provider';
import { NewAnswerEvent, OracleEventType } from './OracleData';
import { useOracle } from './OracleProvider';
import { INITIAL_BLOCKS, Question } from './Question';
import { useFetchQuestionQuery } from './useQuestionQuery';

const useFetchMyAnswersQuery = () => {
  const { networkId, account } = useWeb3();
  const { realitio } = useOracle();
  const fetchQuestion = useFetchQuestionQuery();
  const initialBlock = INITIAL_BLOCKS[networkId];

  const [state, fetch] = useAsyncFn(async () => {
    if (!realitio) throw new Error('Expected realitio');

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
  const { realitio, loading: oracleLoading } = useOracle();
  const fetchMyAnswers = useFetchMyAnswersQuery();
  const [answeredQuestions, setAnsweredQuestions] = React.useState<Question[]>(
    [],
  );

  const { loading } = useAsync(async () => {
    if (realitio) {
      const value = await fetchMyAnswers();

      setAnsweredQuestions(value);
    }
  }, [realitio]);

  const [{ loading: refetchLoading }, refetch] = useAsyncFn(async () => {
    if (realitio) {
      const value = await fetchMyAnswers();

      setAnsweredQuestions(value);
    }
  }, [realitio]);

  return {
    loading: loading || oracleLoading || refetchLoading,
    data: answeredQuestions,
    refetch,
  };
};
