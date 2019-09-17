import BigNumber from 'bn.js';
import { compareDesc } from 'date-fns';
import React from 'react';
import { useAsync, usePrevious } from 'react-use';

import { useFetchBlock } from '../ethereum/useBlockQuery';
import { NewQuestionEvent, OracleEventType } from './OracleData';
import { useOracle } from './OracleProvider';
import { Question, QuestionState } from './Question';
import { useQuestionsCache } from './QuestionsCacheProvider';

export enum QuestionCategory {
  LATEST = 'LATEST',
  CLOSING_SOON = 'CLOSING_SOON',
  HIGH_REWARD = 'HIGH_REWARD',
  RESOLVED = 'RESOLVED',
}

export interface UseQuestionsQueryProps {
  first: number;
  category: QuestionCategory;
}

interface State {
  toBlock: number;
  incrementIndex: number;
  loading: boolean;
}

const initialState: State = {
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

const segregateQuestions = (
  questions: Question[],
  category: QuestionCategory,
) => {
  switch (category) {
    case QuestionCategory.LATEST:
      return questions
        .filter(q => q.state !== QuestionState.FINALIZED)
        .sort((a, b) => compareDesc(a.createdAtDate, b.createdAtDate));
    case QuestionCategory.CLOSING_SOON:
      return questions
        .filter(
          q =>
            q.state === QuestionState.OPEN ||
            q.state === QuestionState.PENDING_ARBITRATION,
        )
        .filter(q => q.finalizedAtDate !== 'UNANSWERED')
        .sort((a, b) => {
          if (
            a.finalizedAtDate === 'UNANSWERED' ||
            b.finalizedAtDate === 'UNANSWERED'
          ) {
            return -1;
          }

          return compareDesc(a.finalizedAtDate, b.finalizedAtDate);
        });
    case QuestionCategory.HIGH_REWARD:
      return questions
        .filter(q => q.state !== QuestionState.FINALIZED)
        .filter(q => q.bounty.gt(new BigNumber(0)))
        .sort((a, b) => {
          if (b.bounty.sub(a.bounty).gt(new BigNumber(0))) {
            return 1;
          }
          if (b.bounty.sub(a.bounty).lt(new BigNumber(0))) {
            return -1;
          }

          return 0;
        });
    case QuestionCategory.RESOLVED:
      return questions
        .filter(q => q.state === QuestionState.FINALIZED)
        .sort((a, b) => {
          if (
            a.finalizedAtDate === 'UNANSWERED' ||
            b.finalizedAtDate === 'UNANSWERED'
          ) {
            return -1;
          }

          return compareDesc(a.finalizedAtDate, b.finalizedAtDate);
        });
    default:
      return questions;
  }
};

export const useQuestionsQuery = (props: UseQuestionsQueryProps) => {
  const { first, category } = props;
  const { realitio, initialBlockNumber } = useOracle();
  const { getManyByIds, questions } = useQuestionsCache();
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const fetchBlock = useFetchBlock();

  const { incrementIndex, toBlock, loading } = state;

  useAsync(async () => {
    const { toBlock } = state;
    const latestBlock = await fetchBlock('latest');
    if (!toBlock) {
      dispatch({
        type: 'update',
        payload: { toBlock: latestBlock.number, loading: true },
      });
    }
  }, [fetchBlock, state]);

  const prevIncrementIndex = usePrevious(incrementIndex);

  useAsync(async () => {
    if (!realitio && toBlock) return;

    if (prevIncrementIndex === incrementIndex && prevIncrementIndex !== 0) {
      return;
    }
    const numberOfBlocksToFetch =
      incrementIndex < BLOCK_INCREMENTS.length
        ? BLOCK_INCREMENTS[incrementIndex]
        : BLOCK_INCREMENTS[BLOCK_INCREMENTS.length - 1];

    let fromBlock = toBlock - numberOfBlocksToFetch;
    if (fromBlock < initialBlockNumber) fromBlock = initialBlockNumber;

    if (toBlock <= initialBlockNumber) {
      dispatch({ type: 'update', payload: { loading: false } });
      return;
    }

    const newQuestionsEvents = (await realitio.getPastEvents(
      OracleEventType.LogNewQuestion,
      { fromBlock, toBlock },
    )) as NewQuestionEvent[];

    await getManyByIds(newQuestionsEvents.map(event => event.args.question_id));

    dispatch({
      type: 'update',
      payload: {
        toBlock: fromBlock - 1,
        incrementIndex: incrementIndex + 1,
      },
    });
  }, [realitio, getManyByIds, incrementIndex, toBlock, initialBlockNumber]);

  const segregatedQuestions = segregateQuestions(questions, category);

  return {
    data: segregatedQuestions.slice(0, first),
    total: segregatedQuestions.length,
    loading,
  };
};
