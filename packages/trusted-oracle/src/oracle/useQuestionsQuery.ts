import { useWeb3 } from '@wetrustplatform/paramount-ethereum';
import BigNumber from 'bn.js';
import { compareDesc } from 'date-fns';
import React from 'react';
import { useAsync } from 'react-use';

import { useOracle } from '../oracle/OracleProvider';

const INITIAL_BLOCKS = {
  1: 6531147,
  3: 0,
  4: 3175028, // for quicker loading start more like 4800000,
  42: 10350865,
  1337: 0,
} as const;

const useLatestBlockQuery = () => {
  const { web3, web3IsLoading } = useWeb3();
  const state = useAsync(async () => {
    if (web3IsLoading) return;

    const latestBlock = await web3.eth.getBlock('latest');

    return latestBlock.number;
  }, [web3IsLoading]);

  return {
    latestBlock: state.value || 0,
    loading: state.loading,
  };
};

interface NewQuestionEventArgs {
  arbitrator: string;
  content_hash: string;
  created: BigNumber;
  nonce: BigNumber;
  opening_ts: BigNumber;
  question: string;
  question_id: string;
  template_id: BigNumber;
  timeout: BigNumber;
  user: string;
}

interface NewQuestionEvent {
  args: NewQuestionEventArgs;
  address: string;
  blockHash: string;
  blockNumber: number;
  event: string;
  id: string;
  logIndex: 62;
  raw: any;
  removed: false;
  returnValues: any;
  signature: string;
  transactionHash: string;
  transactionIndex: 38;
}

interface QuestionFromContract {
  content_hash: string;
  opening_ts: BigNumber;
  timeout: BigNumber;
  finalize_ts: BigNumber;
  is_pending_arbitration: boolean;
  bounty: BigNumber;
  best_answer: string;
  history_hash: string;
  bond: BigNumber;
}

interface QuestionBase {
  id: string;
  createdAtDate: Date;
  createdAtBlock: number;
  createdBy: string;
  contentHash: string;
  questionTitle: string;
  templateId: number;
  openingDate: Date;
}

export interface Question extends QuestionBase {
  timeout: BigNumber;
  finalizeDate: Date;
  isPendingArbitration: boolean;
  bounty: BigNumber;
  bestAnswer: string;
  historyHash: string;
  bond: BigNumber;
}

const toDate = (bigNumber: BigNumber) => {
  return new Date(bigNumber.toNumber() * 1000);
};

const transformNewQuestionEventToQuestion = (
  event: NewQuestionEvent,
): QuestionBase => {
  const { args, blockNumber } = event;

  return {
    id: args.question_id,
    createdAtDate: toDate(args.created),
    createdAtBlock: blockNumber,
    createdBy: args.user,
    contentHash: args.content_hash,
    questionTitle: args.question,
    templateId: args.template_id.toNumber(),
    openingDate: toDate(args.opening_ts),
  };
};

const enrcihQuestionBaseWithQuestionFromContract = (
  question: QuestionBase,
  questionFromContract: QuestionFromContract,
): Question => {
  return {
    ...question,
    timeout: questionFromContract.timeout,
    finalizeDate: toDate(questionFromContract.finalize_ts),
    isPendingArbitration: questionFromContract.is_pending_arbitration,
    bounty: questionFromContract.bounty,
    bestAnswer: questionFromContract.best_answer,
    historyHash: questionFromContract.history_hash,
    bond: questionFromContract.bond,
  };
};

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

            return enrcihQuestionBaseWithQuestionFromContract(
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
    state,
  ]);

  return {
    questions,
    loading,
  };
};
