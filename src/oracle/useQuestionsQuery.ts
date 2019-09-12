import React from 'react';

import { useLatestBlockQuery } from '../ethereum/useLatestBlockQuery';
import { useWeb3 } from '../ethereum/Web3Provider';
import { NewQuestionEvent, OracleEventType } from './OracleData';
import { useOracle } from './OracleProvider';
import { INITIAL_BLOCKS, Question } from './Question';
import { useFetchQuestionQuery } from './useQuestionQuery';

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
  const { loading: oracleIsLoading, realitio } = useOracle();
  const fetchQuestion = useFetchQuestionQuery();
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
    if (!realitio && latestBlock) return;

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

      const newQuestionsEvents = (await realitio.getPastEvents(
        OracleEventType.LogNewQuestion,
        { fromBlock, toBlock },
      )) as NewQuestionEvent[];

      const questionsFromEvents = await Promise.all(
        newQuestionsEvents.map(async event =>
          fetchQuestion(event.args.question_id),
        ),
      );

      const newQuestions = questionsFromEvents.filter(Boolean) as Question[];

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
    realitio,
    initialBlock,
  ]);

  return {
    questions,
    loading,
  };
};
