import BigNumber from 'bn.js';
import { formatDistanceToNow } from 'date-fns';
import React from 'react';
import { useAsyncFn } from 'react-use';
import { Block } from 'web3/eth/types';

import { useCurrency } from '../ethereum/CurrencyProvider';
import { formatCurrency } from '../ethereum/CurrencyUtils';
import { useFetchBlock } from '../ethereum/useBlockQuery';
import { useWeb3 } from '../ethereum/Web3Provider';
import {
  NewAnswerEvent,
  NewQuestionEvent,
  OracleEvent,
  OracleEventType,
} from './OracleData';
import { useOracle } from './OracleProvider';
import {
  Question,
  QuestionFromContract,
  toAnswer,
  toDate,
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

const timeAgo = (dateOrBlock: Date | Block) => {
  const date =
    dateOrBlock instanceof Date
      ? dateOrBlock
      : new Date(dateOrBlock.timestamp * 1000);

  return `${formatDistanceToNow(date)} ago`;
};

export interface NotificationData {
  questionId: string;
  questionTitle: string;
  date: string;
  message: string;
}

export const useFetchNotificationsQuery = () => {
  const { account } = useWeb3();
  const { realitio, initialBlockNumber } = useOracle();
  const { currency } = useCurrency();
  const fetchQuestion = useFetchQuestionQuery();
  const fetchBlock = useFetchBlock();

  const [_, fetch] = useAsyncFn(async () => {
    if (!realitio) return [];

    const events = (await realitio.getPastEvents('allEvents', {
      fromBlock: initialBlockNumber,
      toBlock: 'latest',
    })) as OracleEvent[];

    const notifications = await Promise.all(
      events
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .map(async event => {
          switch (event.event) {
            case OracleEventType.LogNewQuestion:
              if (event.args.user === account) {
                const question = await fetchQuestion(event.args.question_id);

                if (!question) throw new Error('Question not found');

                return {
                  questionId: question.id,
                  date: timeAgo(question.createdAtDate),
                  questionTitle: question.questionTitle,
                  message: 'You asked a question',
                };
              }

              return null;
            case OracleEventType.LogNewAnswer:
              const answeredQuestion = await fetchQuestion(
                event.args.question_id,
              );
              if (!answeredQuestion) throw new Error('Question not found');

              if (event.args.user === account) {
                if (event.args.is_commitment) {
                  return {
                    questionId: answeredQuestion.id,
                    date: timeAgo(toDate(event.args.ts)),
                    questionTitle: answeredQuestion.questionTitle,
                    message: 'You committed to answering a question',
                  };
                } else {
                  return {
                    questionId: answeredQuestion.id,
                    date: timeAgo(toDate(event.args.ts)),
                    questionTitle: answeredQuestion.questionTitle,
                    message: 'You answered a question',
                  };
                }
              }

              if (answeredQuestion.user === account) {
                return {
                  questionId: answeredQuestion.id,
                  date: timeAgo(toDate(event.args.ts)),
                  questionTitle: answeredQuestion.questionTitle,
                  message: 'Someone answered your question',
                };
              } else if (
                answeredQuestion.answers
                  .slice(1)
                  .some(answer => answer.user === account)
              ) {
                return {
                  questionId: answeredQuestion.id,
                  date: timeAgo(toDate(event.args.ts)),
                  questionTitle: answeredQuestion.questionTitle,
                  message: 'Your answer was overwritten',
                };
              }

              return null;

            case OracleEventType.LogAnswerReveal:
              const answerRevealedQuestion = await fetchQuestion(
                event.args.question_id,
              );
              if (!answerRevealedQuestion)
                throw new Error('Question not found');
              const answerRevealBlock = await fetchBlock(event.blockNumber);

              if (event.args.user === account) {
                return {
                  questionId: answerRevealedQuestion.id,
                  date: timeAgo(answerRevealBlock),
                  questionTitle: answerRevealedQuestion.questionTitle,
                  message: 'You revealed an answer to a question',
                };
              }

              if (answerRevealedQuestion.user === account) {
                return {
                  questionId: answerRevealedQuestion.id,
                  date: timeAgo(answerRevealBlock),
                  questionTitle: answerRevealedQuestion.questionTitle,
                  message: 'Someone revealed their answer to your question',
                };
              } else if (
                answerRevealedQuestion.answers
                  .slice(1)
                  .some(answer => answer.user === account)
              ) {
                return {
                  questionId: answerRevealedQuestion.id,
                  date: timeAgo(answerRevealBlock),
                  questionTitle: answerRevealedQuestion.questionTitle,
                  message: 'Your answer was overwritten',
                };
              }

              return null;

            case OracleEventType.LogFundAnswerBounty:
              const rewardBlock = await fetchBlock(event.blockNumber);
              const fundedQuestion = await fetchQuestion(
                event.args.question_id,
              );
              if (!fundedQuestion) throw new Error('Question not found');
              const reward = formatCurrency(event.args.bounty, currency);

              if (event.args.user === account) {
                return {
                  questionId: fundedQuestion.id,
                  date: timeAgo(rewardBlock),
                  questionTitle: fundedQuestion.questionTitle,
                  message: `You added ${reward} ${currency} reward`,
                };
              }

              if (fundedQuestion.user === account) {
                return {
                  questionId: fundedQuestion.id,
                  date: timeAgo(rewardBlock),
                  questionTitle: fundedQuestion.questionTitle,
                  message: `Someone added ${reward} ${currency} reward to your question`,
                };
              } else {
                if (
                  fundedQuestion.answers.some(answer => answer.user === account)
                ) {
                  return {
                    questionId: fundedQuestion.id,
                    date: timeAgo(rewardBlock),
                    questionTitle: fundedQuestion.questionTitle,
                    message: `Someone added ${reward} ${currency} reward to the question you answered`,
                  };
                }
              }

              return null;

            case OracleEventType.LogNotifyOfArbitrationRequest:
              const arbitrationRequestedQuestion = await fetchQuestion(
                event.args.question_id,
              );
              if (!arbitrationRequestedQuestion)
                throw new Error('Question not found');
              const arbitrationRequestBlock = await fetchBlock(
                event.blockNumber,
              );

              if (event.args.user === account) {
                return {
                  questionId: arbitrationRequestedQuestion.id,
                  date: timeAgo(arbitrationRequestBlock),
                  questionTitle: arbitrationRequestedQuestion.questionTitle,
                  message: 'You requested arbitration',
                };
              }

              if (arbitrationRequestedQuestion.user === account) {
                return {
                  questionId: arbitrationRequestedQuestion.id,
                  date: timeAgo(arbitrationRequestBlock),
                  questionTitle: arbitrationRequestedQuestion.questionTitle,
                  message: 'Someone requested arbitration to your question',
                };
              }

              if (
                arbitrationRequestedQuestion.answers.some(
                  answer => answer.user === account,
                )
              ) {
                return {
                  questionId: arbitrationRequestedQuestion.id,
                  date: timeAgo(arbitrationRequestBlock),
                  questionTitle: arbitrationRequestedQuestion.questionTitle,
                  message:
                    'Someone requested arbitration to the question you answered',
                };
              }

              return null;

            case OracleEventType.LogFinalize:
              const finalizedBlock = await fetchBlock(event.blockNumber);
              const finalizedQuestion = await fetchQuestion(
                event.args.question_id,
              );

              if (!finalizedQuestion) throw new Error('Question not found');

              if (finalizedQuestion.user === account) {
                return {
                  questionId: finalizedQuestion.id,
                  date: timeAgo(finalizedBlock),
                  questionTitle: finalizedQuestion.questionTitle,
                  message: 'Your question is finalized',
                };
              } else if (
                finalizedQuestion.answers.some(
                  answer => answer.user === account,
                )
              ) {
                return {
                  questionId: finalizedQuestion.id,
                  date: timeAgo(finalizedBlock),
                  questionTitle: finalizedQuestion.questionTitle,
                  message: 'The question you answered is finalized',
                };
              }

              return null;
            case OracleEventType.LogClaim:
              if (event.args.user === account) {
                const claimedBlock = await fetchBlock(event.blockNumber);
                const claimedQuestion = await fetchQuestion(
                  event.args.question_id,
                );

                if (!claimedQuestion) throw new Error('Question not found');

                return {
                  questionId: claimedQuestion.id,
                  date: timeAgo(claimedBlock),
                  questionTitle: claimedQuestion.questionTitle,
                  message: `You claimed ${formatCurrency(
                    event.args.amount,
                    currency,
                  )}, ${currency}`,
                };
              }

              return null;

            default:
              return null;
          }
        }),
    );

    return notifications.filter(notif => notif !== null) as NotificationData[];
  }, [realitio, initialBlockNumber, fetchQuestion]);

  return fetch;
};

export interface StoreContext {
  notifications: NotificationData[];
  questions: Question[];
  refetch: (id: string) => Promise<void>;
  getById: (id: string) => Promise<Question | null>;
  getManyByIds: (ids: string[]) => Promise<Question[]>;
  refetchIds: (ids: string[]) => Promise<void>;
  getNotifications: () => Promise<void>;
}

const StoreContext = React.createContext<StoreContext>({
  notifications: [],
  questions: [],
  refetch: async () => {},
  refetchIds: async () => {},
  getById: async () => null,
  getManyByIds: async () => [],
  getNotifications: async () => {},
});

export const useStore = () => {
  return React.useContext(StoreContext);
};

export interface StoreProviderProps {
  children?: React.ReactNode;
}

interface State {
  notifications: NotificationData[];
  questions: Question[];
}

const initialState: State = {
  notifications: [],
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
    }
  | {
      type: 'loadNotifications';
      payload: { notifications: NotificationData[] };
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
    case 'loadNotifications':
      return {
        ...state,
        notifications: action.payload.notifications,
      };
    default:
      throw new Error();
  }
};

export const StoreProvider = (props: StoreProviderProps) => {
  const { children } = props;
  const fetchQuestion = useFetchQuestionQuery();
  const fetchNotifications = useFetchNotificationsQuery();
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

  const [_, fetch] = useAsyncFn(async () => {
    if (state.notifications.length) return;

    const notifications = await fetchNotifications();

    if (notifications.length) {
      dispatch({ type: 'loadNotifications', payload: { notifications } });
    }
  }, [fetchNotifications]);

  return (
    <StoreContext.Provider
      value={{
        getById,
        getManyByIds,
        refetch,
        refetchIds,
        questions: state.questions,
        notifications: state.notifications,
        getNotifications: fetch,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
