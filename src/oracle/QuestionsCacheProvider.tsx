import BigNumber from 'bn.js';
import React from 'react';

import {
  NewAnswerEvent,
  NewQuestionEvent,
  OracleEventType,
} from './OracleData';
import { useOracle } from './OracleProvider';
import {
  Question,
  QuestionFromContract,
  toAnswer,
  toQuestion,
  transformNewQuestionEventToQuestion,
} from './Question';

export interface QuestionsCacheContext {
  questions: Question[];
  refetch: (id: string) => Promise<void>;
  getById: (id: string) => Promise<Question | null>;
  getManyByIds: (ids: string[]) => Promise<Question[]>;
  refetchIds: (ids: string[]) => Promise<void>;
}

const QuestionsCacheContext = React.createContext<QuestionsCacheContext>({
  questions: [],
  refetch: async () => {},
  refetchIds: async () => {},
  getById: async () => null,
  getManyByIds: async () => [],
});

export const useQuestionsCache = () => {
  return React.useContext(QuestionsCacheContext);
};

export interface QuestionsCacheProviderProps {
  children?: React.ReactNode;
}

export type FetchQuestion = (questionId: string) => Promise<Question | null>;

export const useFetchQuestionQuery = () => {
  const { realitio, arbitratorContract, initialBlockNumber } = useOracle();

  const fetchQuestion: FetchQuestion = React.useCallback(
    async (questionId: string) => {
      if (!realitio || !arbitratorContract) {
        throw new Error(
          'Oracle and Web3 needs to be loaded first before fetching',
        );
      }

      const newQuestionsEvents = (await realitio.getPastEvents(
        OracleEventType.LogNewQuestion,
        {
          fromBlock: initialBlockNumber,
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

      const questionFromContract = (await realitio.questions.call(
        newQuestionEvent.args.question_id,
      )) as QuestionFromContract;

      const answerEvents = (await realitio.getPastEvents(
        OracleEventType.LogNewAnswer,
        {
          fromBlock: initialBlockNumber,
          toBlock: 'latest',
          // eslint-disable-next-line
          filter: { question_id: newQuestionEvent.args.question_id },
        },
      )) as NewAnswerEvent[];

      const arbitrator = await arbitratorContract.at(questionBase.arbitrator);
      const disputeFee = (await arbitrator.getDisputeFee.call(
        questionBase.id,
      )) as BigNumber;

      const question = toQuestion(
        questionBase,
        questionFromContract,
        disputeFee,
        toAnswer(answerEvents),
      );

      return question;
    },
    [realitio, initialBlockNumber, arbitratorContract],
  );

  return fetchQuestion;
};

export const QuestionsCacheProvider = (props: QuestionsCacheProviderProps) => {
  const { children } = props;
  const fetchQuestion = useFetchQuestionQuery();
  const [questions, setQuestions] = React.useState<Question[]>([]);

  const getById = React.useCallback(
    async (id: string) => {
      const existingQuestion = questions.find(q => q.id === id);

      if (existingQuestion) return existingQuestion;

      const question = await fetchQuestion(id);

      if (!question) return null;

      setQuestions(questions.concat(question));

      return question;
    },
    [fetchQuestion, questions],
  );

  const refetch = React.useCallback(
    async (id: string) => {
      const refetchedQuestion = await fetchQuestion(id);

      if (refetchedQuestion) {
        const existingQuestion = questions.find(q => q.id === id);

        if (existingQuestion) {
          setQuestions(
            questions
              .filter(q => q.id !== refetchedQuestion.id)
              .concat(refetchedQuestion),
          );
        } else {
          setQuestions(questions.concat(refetchedQuestion));
        }
      }
    },
    [fetchQuestion, questions],
  );

  const refetchIds = React.useCallback(
    async (ids: string[]) => {
      const refetchedQuestions = (await Promise.all(
        ids.map(async id => {
          const question = await fetchQuestion(id);

          return question;
        }),
      )).filter(Boolean) as Question[];

      setQuestions(
        questions
          .filter(q => !refetchedQuestions.map(rq => rq.id).includes(q.id))
          .concat(refetchedQuestions),
      );
    },
    [fetchQuestion, questions],
  );

  const getManyByIds = React.useCallback(
    async (ids: string[]) => {
      const newQuestions: Question[] = [];

      const returnedQuestions = (await Promise.all(
        ids.map(async id => {
          const existingQuestion = questions.find(q => q.id === id);

          if (existingQuestion) return existingQuestion;
          const question = await fetchQuestion(id);

          if (question) newQuestions.push(question);

          return question;
        }),
      )).filter(Boolean) as Question[];

      if (newQuestions.length) {
        setQuestions(questions.concat(newQuestions));
      }

      return returnedQuestions;
    },
    [fetchQuestion, questions],
  );

  return (
    <QuestionsCacheContext.Provider
      value={{ getById, getManyByIds, refetch, refetchIds, questions }}
    >
      {children}
    </QuestionsCacheContext.Provider>
  );
};
