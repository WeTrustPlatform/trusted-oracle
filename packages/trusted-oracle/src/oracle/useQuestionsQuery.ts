import { useWeb3 } from '@wetrustplatform/paramount-ethereum';
import { compareDesc } from 'date-fns';
import React from 'react';

import { useLatestBlockQuery } from '../blockchain/useLatestBlockQuery';
import { useOracle } from '../oracle/OracleProvider';
import {
  enrichQuestionBaseWithQuestionFromContract,
  NewQuestionEvent,
  Question,
  QuestionFromContract,
  transformNewQuestionEventToQuestion,
} from './Question';

const INITIAL_BLOCKS = {
  1: 6531147,
  3: 0,
  4: 3175028, // for quicker loading start more like 4800000,
  42: 10350865,
  1337: 0,
} as const;

interface State {
  questions: Question[];
  toBlock: number;
  incrementIndex: number;
  loading: boolean;
}

const initialState: State = {
  questions: [],
  toBlock: 0,
  incrementIndex: 0,
  loading: true,
};

const BLOCK_INCREMENTS = [100, 2500, 5000];

interface Action {
  type: 'update';
  payload: Partial<State>;
}

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'update':
      return { ...state, ...action.payload };
    default:
      throw new Error();
  }
};

export const useQuestionsQuery = () => {
  const { networkId, web3IsLoading } = useWeb3();
  const { loading: oracleIsLoading, realitioContract } = useOracle();
  const initialBlock = INITIAL_BLOCKS[networkId];
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { incrementIndex, questions, toBlock, loading } = state;

  const { latestBlock, loading: latestBlockIsLoading } = useLatestBlockQuery();

  React.useEffect(() => {
    if (oracleIsLoading || web3IsLoading || latestBlockIsLoading) return;
    if (latestBlock) {
      dispatch({ type: 'update', payload: { toBlock: latestBlock } });
    }
  }, [oracleIsLoading, web3IsLoading, latestBlockIsLoading, latestBlock]);

  React.useEffect(() => {
    if (oracleIsLoading || web3IsLoading || latestBlockIsLoading) return;
    if (!realitioContract && latestBlock) return;

    const fetchQuestions = async () => {
      const numberOfBlocksToFetch =
        incrementIndex < BLOCK_INCREMENTS.length
          ? BLOCK_INCREMENTS[incrementIndex]
          : BLOCK_INCREMENTS[BLOCK_INCREMENTS.length - 1];

      let fromBlock = toBlock - numberOfBlocksToFetch;
      if (fromBlock < initialBlock) fromBlock = initialBlock;

      if (toBlock <= initialBlock) {
        dispatch({ type: 'update', payload: { loading: false } });
        return;
      }

      const newQuestionsEvents = (await realitioContract.getPastEvents(
        'LogNewQuestion',
        { fromBlock, toBlock },
      )) as NewQuestionEvent[];

      const newQuestions = await Promise.all(
        newQuestionsEvents
          .map(transformNewQuestionEventToQuestion)
          .sort((a, b) => compareDesc(a.createdAtDate, b.createdAtDate))
          .map(async question => {
            const questionFromContract = (await realitioContract.questions.call(
              question.id,
            )) as QuestionFromContract;

            return enrichQuestionBaseWithQuestionFromContract(
              question,
              questionFromContract,
            );
          }),
      );

      dispatch({
        type: 'update',
        payload: {
          toBlock: fromBlock - 1,
          incrementIndex: incrementIndex + 1,
          questions: questions.concat(newQuestions),
        },
      });
    };

    fetchQuestions();
  }, [
    oracleIsLoading,
    web3IsLoading,
    latestBlockIsLoading,
    latestBlock,
    incrementIndex,
    questions,
    toBlock,
    loading,
    realitioContract,
    initialBlock,
  ]);

  return {
    questions,
    loading,
  };
};