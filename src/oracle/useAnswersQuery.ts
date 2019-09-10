import { useAsync } from 'react-use';

import { useWeb3 } from '../ethereum/Web3Provider';
import { useOracle } from './OracleProvider';
import { INITIAL_BLOCKS, NewAnswerEvent, toAnswer } from './Question';

export const useAnswersQuery = (questionId: string) => {
  const { networkId, web3IsLoading } = useWeb3();
  const { loading: oracleIsLoading, realitio } = useOracle();
  const initialBlock = INITIAL_BLOCKS[networkId];

  const { value, loading } = useAsync(async () => {
    if (!realitio) throw new Error('Expected contract instance');

    const answerEvents = (await realitio.getPastEvents('LogNewAnswer', {
      fromBlock: initialBlock,
      toBlock: 'latest',
      // eslint-disable-next-line
      filter: { question_id: questionId },
    })) as NewAnswerEvent[];

    return toAnswer(answerEvents);
  }, [questionId, realitio]);

  return {
    data: value || [],
    loading: loading || oracleIsLoading || web3IsLoading,
  };
};
