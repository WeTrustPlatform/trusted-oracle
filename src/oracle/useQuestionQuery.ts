import React from 'react';
import { useAsync } from 'react-use';

import { Question } from './Question';
import { useQuestionsCache } from './QuestionsCacheProvider';

export type FetchQuestion = (
  questionId: string,
  forceFetch?: boolean,
) => Promise<Question | null>;

export const useQuestionQuery = (questionId: string) => {
  const { getById } = useQuestionsCache();
  const [result, setQuestion] = React.useState<{
    loading: boolean;
    data: Question | null;
  }>({
    loading: true,
    data: null,
  });

  useAsync(async () => {
    const question = await getById(questionId);

    setQuestion({ loading: false, data: question });
  }, [getById, questionId]);

  return {
    data: result.data,
    loading: result.loading,
  };
};
