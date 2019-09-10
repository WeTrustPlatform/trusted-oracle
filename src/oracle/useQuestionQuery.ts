import React from 'react';
import { useAsync } from 'react-use';

import { useWeb3 } from '../ethereum/Web3Provider';
import { useOracle } from './OracleProvider';
import {
  NewQuestionEvent,
  Question,
  QuestionFromContract,
  QuestionJson,
  toQuestion,
  toQuestionBasic,
  transformNewQuestionEventToQuestion,
} from './Question';
import { QuestionUtils } from './QuestionUtils';

const INITIAL_BLOCKS = {
  1: 6531147,
  3: 0,
  4: 3175028, // for quicker loading start more like 4800000,
  42: 10350865,
  1337: 0,
} as const;

export type FetchQuestion = (questionId: string) => Promise<Question | null>;

export const useFetchQuestionQuery = () => {
  const { networkId } = useWeb3();
  const { realitioContract, templates } = useOracle();
  const initialBlock = INITIAL_BLOCKS[networkId];

  const fetchQuestion: FetchQuestion = React.useCallback(
    async (questionId: string) => {
      if (!realitioContract) {
        throw new Error(
          'Oracle and Web3 needs to be loaded first before fetching',
        );
      }

      const newQuestionsEvents = (await realitioContract.getPastEvents(
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

      const questionFromContract = (await realitioContract.questions.call(
        questionId,
      )) as QuestionFromContract;

      const questionJson = QuestionUtils.populatedJSONForTemplate(
        templates[questionBase.templateId],
        questionBase.questionTitle,
      ) as QuestionJson;

      return toQuestion(
        toQuestionBasic(questionBase, questionFromContract),
        questionJson,
      );
    },
    [realitioContract, initialBlock],
  );

  return fetchQuestion;
};

export const useQuestionQuery = (questionId: string) => {
  const { web3IsLoading } = useWeb3();
  const { loading: oracleIsLoading, realitioContract } = useOracle();
  const fetchQuestion = useFetchQuestionQuery();

  const { value, loading } = useAsync(async () => {
    const question = await fetchQuestion(questionId);

    return question;
  }, [fetchQuestion, questionId]);

  return {
    data: value,
    loading: oracleIsLoading || web3IsLoading || !realitioContract || loading,
  };
};
