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

interface State {
  questions: Question[];
}

const initialState: State = {
  questions: [],
};

type Action =
  | {
      type: 'update';
      payload: { question: Question };
    }
  | {
      type: 'updateBatch';
      payload: { questions: Question[] };
    }
  | {
      type: 'insert';
      payload: { question: Question };
    }
  | {
      type: 'insertBatch';
      payload: { questions: Question[] };
    };

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'insert':
      return {
        ...state,
        questions: state.questions
          .filter(q => q.id !== action.payload.question.id)
          .concat(action.payload.question),
      };
    case 'insertBatch':
      return {
        ...state,
        questions: state.questions
          .filter(
            q => !action.payload.questions.map(rq => rq.id).includes(q.id),
          )
          .concat(action.payload.questions),
      };
    case 'update':
      return {
        ...state,
        questions: state.questions
          .filter(q => q.id !== action.payload.question.id)
          .concat(action.payload.question),
      };
    case 'updateBatch':
      return {
        ...state,
        questions: state.questions
          .filter(
            q => !action.payload.questions.map(rq => rq.id).includes(q.id),
          )
          .concat(action.payload.questions),
      };
    default:
      throw new Error();
  }
};

export const QuestionsCacheProvider = (props: QuestionsCacheProviderProps) => {
  const { children } = props;
  const fetchQuestion = useFetchQuestionQuery();
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const getById = React.useCallback(
    async (id: string) => {
      const { questions } = state;
      const existingQuestion = questions.find(q => q.id === id);

      if (existingQuestion) return existingQuestion;

      const question = await fetchQuestion(id);

      if (!question) return null;

      dispatch({ type: 'insert', payload: { question } });

      return question;
    },
    [fetchQuestion, state],
  );

  const refetch = React.useCallback(
    async (id: string) => {
      const { questions } = state;
      const refetchedQuestion = await fetchQuestion(id);

      if (refetchedQuestion) {
        const existingQuestion = questions.find(q => q.id === id);

        if (existingQuestion) {
          dispatch({
            type: 'update',
            payload: { question: refetchedQuestion },
          });
        } else {
          dispatch({
            type: 'insert',
            payload: { question: refetchedQuestion },
          });
        }
      }
    },
    [fetchQuestion, state],
  );

  const refetchIds = React.useCallback(
    async (ids: string[]) => {
      const refetchedQuestions = (await Promise.all(
        ids.map(async id => {
          const question = await fetchQuestion(id);

          return question;
        }),
      )).filter(Boolean) as Question[];

      dispatch({
        type: 'updateBatch',
        payload: { questions: refetchedQuestions },
      });
    },
    [fetchQuestion, state],
  );

  const getManyByIds = React.useCallback(
    async (ids: string[]) => {
      const { questions } = state;
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
        dispatch({ type: 'insertBatch', payload: { questions: newQuestions } });
      }

      return returnedQuestions;
    },
    [fetchQuestion, state],
  );

  // console.log(state, 'state');

  return (
    <QuestionsCacheContext.Provider
      value={{
        getById,
        getManyByIds,
        refetch,
        refetchIds,
        questions: state.questions,
      }}
    >
      {children}
    </QuestionsCacheContext.Provider>
  );
};
