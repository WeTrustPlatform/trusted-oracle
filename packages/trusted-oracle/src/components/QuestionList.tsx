import { useWeb3 } from '@wetrustplatform/paramount-ethereum';
import BigNumber from 'bn.js';
import React from 'react';
import { useAsync } from 'react-use';

import { useOracle } from '../oracle/OracleProvider';

const BEGINNING_BLOCKS = {
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
    latestBlockNumber: state.value || 0,
    loading: state.loading,
  };
};

type NewQuestionEventArgs = {
  0: string;
  1: string;
  2: BigNumber;
  3: string;
  4: string;
  5: string;
  6: BigNumber;
  7: BigNumber;
  8: BigNumber;
  9: BigNumber;
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
};

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

const transformNewQuestionEventToQuestion = (event: NewQuestionEvent) => {
  const { args, blockNumber } = event;

  return {
    id: args[0],
    reward: args[6],
    creationAtDate: args.created,
    createdAtBlock: blockNumber,
    createdBy: args.user,
    contentHash: args.content_hash,
    questionTitle: args.question,
    templateId: args.template_id.toNumber(),
    openingDate: args.opening_ts,
  };
};

export const useFetchQuestions = () => {
  const { networkId, web3IsLoading } = useWeb3();
  const { loading: oracleIsLoading, realitioContract } = useOracle();
  const beginningBlockNumber = BEGINNING_BLOCKS[networkId];

  const {
    latestBlockNumber,
    loading: latestBlockIsLoading,
  } = useLatestBlockQuery();

  const { loading, value } = useAsync(async () => {
    if (oracleIsLoading || web3IsLoading || latestBlockIsLoading) return;
    if (!realitioContract) return;

    const newQuestionsEvents = (await realitioContract.getPastEvents(
      'LogNewQuestion',
      {
        fromBlock: beginningBlockNumber,
        toBlock: latestBlockNumber,
      },
    )) as NewQuestionEvent[];

    return newQuestionsEvents.map(transformNewQuestionEventToQuestion);
  }, [oracleIsLoading, web3IsLoading, latestBlockIsLoading]);

  return {
    loading: !(!loading && value),
    questions: value || [],
  };
};

export const QuestionList = () => {
  const { loading, questions } = useFetchQuestions();
  console.log(loading, questions);

  return <></>;
};
