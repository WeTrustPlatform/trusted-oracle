import { sortBy } from 'lodash';
import React from 'react';
import { useAsync } from 'react-use';

import { NewQuestionEvent, OracleEventType } from './OracleData';
import { useOracle } from './OracleProvider';
import { Question } from './Question';
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

export const useQuestionsQuery = (props: UseQuestionsQueryProps) => {
  const { first, category } = props;
  const { realitio, initialBlockNumber } = useOracle();
  const { getManyByIds } = useQuestionsCache();
  const [newQuestionEvents, setNewQuestionEvents] = React.useState<
    NewQuestionEvent[]
  >([]);

  const [result, setResult] = React.useState<{
    loading: boolean;
    data: Question[];
  }>({
    loading: true,
    data: [],
  });

  useAsync(async () => {
    if (!realitio) return;
    const events = (await realitio.getPastEvents(
      OracleEventType.LogNewQuestion,
      { fromBlock: initialBlockNumber, toBlock: 'latest' },
    )) as NewQuestionEvent[];

    const descendingEvents = sortBy(events, 'blockNumber').reverse();

    setNewQuestionEvents(descendingEvents);
  }, [realitio, initialBlockNumber]);

  React.useEffect(() => {
    setResult({ loading: true, data: result.data });
  }, [first]);

  useAsync(async () => {
    if (!newQuestionEvents.length) return;

    const questions = await getManyByIds(
      newQuestionEvents.slice(0, first).map(event => event.args.question_id),
    );

    setResult({ loading: false, data: questions });
  }, [newQuestionEvents, getManyByIds, first]);

  return result;
};
