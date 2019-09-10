import React from 'react';
import { useAsync } from 'react-use';

import { useWeb3 } from '../ethereum/Web3Provider';
import { useOracle } from './OracleProvider';
import {
  INITIAL_BLOCKS,
  NewQuestionEvent,
  Question,
  QuestionFromContract,
  toQuestion,
  transformNewQuestionEventToQuestion,
} from './Question';

export type FetchQuestion = (questionId: string) => Promise<Question | null>;

export const useFetchQuestionQuery = () => {
  const { networkId } = useWeb3();
  const { realitio } = useOracle();
  const initialBlock = INITIAL_BLOCKS[networkId];

  const fetchQuestion: FetchQuestion = React.useCallback(
    async (questionId: string) => {
      if (!realitio) {
        throw new Error(
          'Oracle and Web3 needs to be loaded first before fetching',
        );
      }

      const newQuestionsEvents = (await realitio.getPastEvents(
        'LogNewQuestion',
        {
          fromBlock: initialBlock,
          toBlock: 'latest',
          // eslint-disable-next-line
          filter: { question_id: questionId },
        },
      )) as NewQuestionEvent[];

      if (newQuestionsEvents.length === 0) {
        return null;
      }
      if (newQuestionsEvents.length > 1) {
        throw new Error(
          'There should only be one NewQuestion event tied to the questionId',
        );
      }

      const newQuestionEvent = newQuestionsEvents[0];

      const questionBase = transformNewQuestionEventToQuestion(
        newQuestionEvent,
      );

      const questionFromContract = (await realitio.questions.call(
        questionId,
      )) as QuestionFromContract;

      return toQuestion(questionBase, questionFromContract);
    },
    [realitio, initialBlock],
  );

  return fetchQuestion;
};

export const useQuestionQuery = (questionId: string) => {
  const { web3IsLoading } = useWeb3();
  const { loading: oracleIsLoading, realitio } = useOracle();
  const fetchQuestion = useFetchQuestionQuery();
  const [question, setQuestion] = React.useState<Question | null>(null);

  const { loading } = useAsync(async () => {
    const result = await fetchQuestion(questionId);
    setQuestion(result);
  }, [fetchQuestion, questionId]);

  const refetch = React.useCallback(async () => {
    const result = await fetchQuestion(questionId);

    setQuestion(result);
  }, [fetchQuestion, questionId]);

  return {
    data: question,
    loading: oracleIsLoading || web3IsLoading || !realitio || loading,
    refetch,
  };
};
