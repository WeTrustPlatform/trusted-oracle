import React from 'react';
import { useAsync } from 'react-use';

import { useRealitio } from './RealitioProvider';

export const useFetchQuestions = () => {
  const { loading, realitioContract } = useRealitio();

  const state = useAsync(async () => {
    if (!realitioContract) return [];
    console.log('>>>>>>>>>>');

    const questionPosted = await realitioContract.LogNewQuestion(
      {},
      {
        fromBlock: 10,
        toBlock: 100,
      },
    );

    console.log(questionPosted, 'questionPosted');

    return [];
  }, [loading, realitioContract]);

  return {
    loading: state.loading || loading,
    questions: state.value,
  };
};

export const QuestionList = () => {
  const { loading, questions } = useFetchQuestions();
  console.log(loading, questions);

  return <></>;
};
