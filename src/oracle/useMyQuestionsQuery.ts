import React from 'react';
import { useAsync } from 'react-use';

import { useWeb3 } from '../ethereum/Web3Provider';
import { NewQuestionEvent, OracleEventType } from '../oracle/OracleData';
import { useOracle } from '../oracle/OracleProvider';
import { INITIAL_BLOCKS, Question } from '../oracle/Question';
import { useFetchQuestionQuery } from '../oracle/useQuestionQuery';

export const useMyQuestionsQuery = () => {
  const { networkId, account } = useWeb3();
  const { realitio, loading: oracleLoading } = useOracle();
  const fetchQuestion = useFetchQuestionQuery();
  const initialBlock = INITIAL_BLOCKS[networkId];

  const { loading, value } = useAsync(async () => {
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

  return {
    loading: loading || oracleLoading,
    data: value || [],
  };
};
