import BigNumber from 'bn.js';
import { formatDistanceToNow } from 'date-fns/esm';
import { uniqBy } from 'lodash';
import {
  Box,
  Column,
  Container,
  Heading,
  Icon,
  Row,
  Text,
  useTheme,
} from 'paramount-ui';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useAsync } from 'react-use';
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
} from '../oracle/OracleData';
import { useOracle } from '../oracle/OracleProvider';
import { INITIAL_BLOCKS, Question, toDate } from '../oracle/Question';
import { QuestionCard } from '../oracle/QuestionList';
import { useFetchQuestionQuery } from '../oracle/useQuestionQuery';
import { Background } from './Background';
import { Tabs } from './CustomTabs';
import { Link } from './Link';

const timeAgo = (dateOrBlock: Date | Block) => {
  const date =
    dateOrBlock instanceof Date
      ? dateOrBlock
      : new Date(dateOrBlock.timestamp * 1000);

  return `${formatDistanceToNow(date)} ago`;
};

interface NotificationProps {
  questionId: string;
  questionTitle: string;
  date: string;
  message: string;
}

const Notification = (props: NotificationProps) => {
  const { questionId, questionTitle, date, message } = props;

  return (
    <Link to={`/question/${questionId}`}>
      <Box>
        <Box paddingBottom={16}>
          <Text color="muted">
            {message} {date}
          </Text>
          <Text weight="bold">{questionTitle}</Text>
        </Box>
      </Box>
    </Link>
  );
};

const useNotifications = () => {
  const { networkId, account } = useWeb3();
  const { realitio } = useOracle();
  const { currency } = useCurrency();
  const fetchQuestion = useFetchQuestionQuery();
  const initialBlock = INITIAL_BLOCKS[networkId];
  const fetchBlock = useFetchBlock();

  const { loading, value } = useAsync(async () => {
    const events = (await realitio.getPastEvents('allEvents', {
      fromBlock: initialBlock,
      toBlock: 'latest',
    })) as OracleEvent[];

    const notifications = await Promise.all(
      events.reverse().map(async event => {
        switch (event.event) {
          case OracleEventType.LogNewQuestion:
            if (event.args.user === account) {
              const question = await fetchQuestion(event.args.question_id);

              if (!question) throw new Error('Question not found');

              return (
                <Notification
                  questionId={question.id}
                  date={timeAgo(question.createdAtDate)}
                  questionTitle={question.questionTitle}
                  message="You asked a question"
                />
              );
            }

            return null;
          case OracleEventType.LogNewAnswer:
            const answeredQuestion = await fetchQuestion(
              event.args.question_id,
            );
            if (!answeredQuestion) throw new Error('Question not found');

            if (event.args.user === account) {
              if (event.args.is_commitment) {
                return (
                  <Notification
                    questionId={answeredQuestion.id}
                    date={timeAgo(toDate(event.args.ts))}
                    questionTitle={answeredQuestion.questionTitle}
                    message="You committed to answering a question"
                  />
                );
              } else {
                return (
                  <Notification
                    questionId={answeredQuestion.id}
                    date={timeAgo(toDate(event.args.ts))}
                    questionTitle={answeredQuestion.questionTitle}
                    message="You answered a question"
                  />
                );
              }
            }

            if (answeredQuestion.user === account) {
              return (
                <Notification
                  questionId={answeredQuestion.id}
                  date={timeAgo(toDate(event.args.ts))}
                  questionTitle={answeredQuestion.questionTitle}
                  message="Someone answered your question"
                />
              );
            } else if (
              answeredQuestion.answers
                .slice(1)
                .some(answer => answer.user === account)
            ) {
              return (
                <Notification
                  questionId={answeredQuestion.id}
                  date={timeAgo(toDate(event.args.ts))}
                  questionTitle={answeredQuestion.questionTitle}
                  message="Your answer was overwritten"
                />
              );
            }

            return null;

          case OracleEventType.LogAnswerReveal:
            const answerRevealedQuestion = await fetchQuestion(
              event.args.question_id,
            );
            if (!answerRevealedQuestion) throw new Error('Question not found');
            const answerRevealBlock = await fetchBlock(event.blockNumber);

            if (event.args.user === account) {
              return (
                <Notification
                  questionId={answerRevealedQuestion.id}
                  date={timeAgo(answerRevealBlock)}
                  questionTitle={answerRevealedQuestion.questionTitle}
                  message="You revealed an answer to a question"
                />
              );
            }

            if (answerRevealedQuestion.user === account) {
              return (
                <Notification
                  questionId={answerRevealedQuestion.id}
                  date={timeAgo(answerRevealBlock)}
                  questionTitle={answerRevealedQuestion.questionTitle}
                  message="Someone revealed their answer to your question"
                />
              );
            } else if (
              answerRevealedQuestion.answers
                .slice(1)
                .some(answer => answer.user === account)
            ) {
              return (
                <Notification
                  questionId={answerRevealedQuestion.id}
                  date={timeAgo(answerRevealBlock)}
                  questionTitle={answerRevealedQuestion.questionTitle}
                  message="Your answer was overwritten"
                />
              );
            }

            return null;

          case OracleEventType.LogFundAnswerBounty:
            const rewardBlock = await fetchBlock(event.blockNumber);
            const fundedQuestion = await fetchQuestion(event.args.question_id);
            if (!fundedQuestion) throw new Error('Question not found');
            const reward = formatCurrency(event.args.bounty, currency);

            if (event.args.user === account) {
              return (
                <Notification
                  questionId={fundedQuestion.id}
                  date={timeAgo(rewardBlock)}
                  questionTitle={fundedQuestion.questionTitle}
                  message={`You added ${reward} ${currency} reward`}
                />
              );
            }

            if (fundedQuestion.user === account) {
              return (
                <Notification
                  questionId={fundedQuestion.id}
                  date={timeAgo(rewardBlock)}
                  questionTitle={fundedQuestion.questionTitle}
                  message={`Someone added ${reward} ${currency} reward to your question`}
                />
              );
            } else {
              if (
                fundedQuestion.answers.some(answer => answer.user === account)
              ) {
                return (
                  <Notification
                    questionId={fundedQuestion.id}
                    date={timeAgo(rewardBlock)}
                    questionTitle={fundedQuestion.questionTitle}
                    message={`Someone added ${reward} ${currency} reward to the question you answered`}
                  />
                );
              }
            }

            return null;

          case OracleEventType.LogNotifyOfArbitrationRequest:
            const arbitrationRequestedQuestion = await fetchQuestion(
              event.args.question_id,
            );
            if (!arbitrationRequestedQuestion)
              throw new Error('Question not found');
            const arbitrationRequestBlock = await fetchBlock(event.blockNumber);

            if (event.args.user === account) {
              return (
                <Notification
                  questionId={arbitrationRequestedQuestion.id}
                  date={timeAgo(arbitrationRequestBlock)}
                  questionTitle={arbitrationRequestedQuestion.questionTitle}
                  message="You requested arbitration"
                />
              );
            }

            if (arbitrationRequestedQuestion.user === account) {
              return (
                <Notification
                  questionId={arbitrationRequestedQuestion.id}
                  date={timeAgo(arbitrationRequestBlock)}
                  questionTitle={arbitrationRequestedQuestion.questionTitle}
                  message="Someone requested arbitration to your question"
                />
              );
            }

            if (
              arbitrationRequestedQuestion.answers.some(
                answer => answer.user === account,
              )
            ) {
              return (
                <Notification
                  questionId={arbitrationRequestedQuestion.id}
                  date={timeAgo(arbitrationRequestBlock)}
                  questionTitle={arbitrationRequestedQuestion.questionTitle}
                  message="Someone requested arbitration to the question you answered"
                />
              );
            }

            return null;

          case OracleEventType.LogFinalize:
            const finalizedBlock = await fetchBlock(event.blockNumber);
            const finalizedQuestion = await fetchQuestion(
              event.args.question_id,
            );

            if (!finalizedQuestion) throw new Error('Question not found');

            if (finalizedQuestion.user === account) {
              return (
                <Notification
                  questionId={finalizedQuestion.id}
                  date={timeAgo(finalizedBlock)}
                  questionTitle={finalizedQuestion.questionTitle}
                  message="Your question is finalized"
                />
              );
            } else if (
              finalizedQuestion.answers.some(answer => answer.user === account)
            ) {
              return (
                <Notification
                  questionId={finalizedQuestion.id}
                  date={timeAgo(finalizedBlock)}
                  questionTitle={finalizedQuestion.questionTitle}
                  message="The question you answered is finalized"
                />
              );
            }

            return null;

          default:
            return null;
        }
      }),
    );

    return notifications.filter(notif => notif !== null) as JSX.Element[];
  }, [realitio]);

  return {
    loading,
    data: value || [],
  };
};

enum MyAccountTab {
  QUESTION = 'QUESTION',
  ANSWER = 'ANSWER',
}

const useMyAnswersQuery = () => {
  const { networkId, account } = useWeb3();
  const { realitio } = useOracle();
  const fetchQuestion = useFetchQuestionQuery();
  const initialBlock = INITIAL_BLOCKS[networkId];

  const { loading, value } = useAsync(async () => {
    const events = (await realitio.getPastEvents(OracleEventType.LogNewAnswer, {
      fromBlock: initialBlock,
      toBlock: 'latest',
      filter: { user: account },
    })) as NewAnswerEvent[];

    const uniqueEvents = uniqBy(events, event => event.args.question_id);

    const questions = await Promise.all(
      uniqueEvents.map(async event => fetchQuestion(event.args.question_id)),
    );

    return questions.filter(Boolean) as Question[];
  }, [realitio]);

  return {
    loading,
    data: value || [],
  };
};

const useMyQuestionsQuery = () => {
  const { networkId, account } = useWeb3();
  const { realitio } = useOracle();
  const fetchQuestion = useFetchQuestionQuery();
  const initialBlock = INITIAL_BLOCKS[networkId];

  const { loading, value } = useAsync(async () => {
    const events = (await realitio.getPastEvents(
      OracleEventType.LogNewQuestion,
      {
        fromBlock: initialBlock,
        toBlock: 'latest',
        filter: { user: account },
      },
    )) as NewQuestionEvent[];

    const questions = await Promise.all(
      events.map(async event => fetchQuestion(event.args.question_id)),
    );

    return questions.filter(Boolean) as Question[];
  }, [realitio]);

  return {
    loading,
    data: value || [],
  };
};

const useBalanceQuery = () => {
  const { account, web3 } = useWeb3();
  const { currency, tokenInstance } = useCurrency();

  const { value, loading } = useAsync(async () => {
    if (!account) throw new Error('Expected account');

    const balance = await (currency === 'ETH'
      ? web3.eth.getBalance(account)
      : tokenInstance.balanceOf.call(account));

    return balance as BigNumber;
  }, [account, web3, currency, tokenInstance]);

  return {
    data: value || new BigNumber(0),
    loading,
  };
};

interface NotificationsPreviewProps {
  notifications: React.ReactElement[];
  onPressSeeAllNotifications: () => void;
}

const NotificationPreview = (props: NotificationsPreviewProps) => {
  const { notifications, onPressSeeAllNotifications } = props;

  return (
    <Box>
      <Box flexDirection="row" justifyContent="space-between">
        <Text weight="bold" color="primary">
          Latest activity
        </Text>
        <TouchableOpacity onPress={onPressSeeAllNotifications}>
          <Text color="secondary">See all</Text>
        </TouchableOpacity>
      </Box>
      {notifications.map((notification, index) => (
        <Box key={index}>{notification}</Box>
      ))}
    </Box>
  );
};

interface MainProps extends NotificationsPreviewProps {
  tab: MyAccountTab;
  setTab: (tab: MyAccountTab) => void;
  questions: Question[];
  answeredQuestions: Question[];
  balance: BigNumber;
}

const Main = (props: MainProps) => {
  const {
    questions,
    balance,
    answeredQuestions,
    tab,
    notifications,
    setTab,
    onPressSeeAllNotifications,
  } = props;
  const { currency } = useCurrency();

  return (
    <Box>
      <Box paddingBottom={16} paddingHorizontal={60} paddingTop={40}>
        <Heading align="center" color="primary" size="xxlarge">
          MY ACCOUNT
        </Heading>
      </Box>
      <Background pattern="textured">
        <Box paddingHorizontal={60} paddingVertical={24}>
          <Text color="primary" weight="bold">
            Your balance: {formatCurrency(balance, currency)} {currency}
          </Text>
        </Box>
      </Background>
      <Box paddingHorizontal={60} paddingVertical={24}>
        <NotificationPreview
          notifications={notifications.slice(0, 1)}
          onPressSeeAllNotifications={onPressSeeAllNotifications}
        />
      </Box>
      <Background pattern="dotted">
        <Box paddingHorizontal={60}>
          <Box paddingBottom={40} paddingTop={24}>
            <Tabs
              // eslint-disable-next-line
              // @ts-ignore: we know that only MyAccountTab is passed in
              onChangeTab={setTab}
              currentValue={tab}
              tabs={[
                {
                  label: 'QUESTION',
                  value: MyAccountTab.QUESTION,
                },
                {
                  label: 'ANSWER',
                  value: MyAccountTab.ANSWER,
                },
              ]}
            />
          </Box>
          <Container>
            <Row>
              {(tab === MyAccountTab.ANSWER
                ? answeredQuestions
                : questions
              ).map(question => (
                <Column key={question.id}>
                  <Box paddingBottom={24}>
                    <QuestionCard question={question} />
                  </Box>
                </Column>
              ))}
            </Row>
          </Container>
        </Box>
      </Background>
    </Box>
  );
};

interface AllNotificationsProps {
  notifications: React.ReactElement[];
  onClose: () => void;
}

const AllNotifications = (props: AllNotificationsProps) => {
  const { notifications, onClose } = props;
  const theme = useTheme();

  return (
    <Box>
      <Box paddingTop={40} paddingLeft={16} alignItems="flex-start">
        <TouchableOpacity onPress={onClose}>
          <View style={{ width: 40, height: 40 }}>
            <Icon
              size={24}
              name="arrow-left"
              color={theme.colors.text.primary}
            />
          </View>
        </TouchableOpacity>
      </Box>
      <Box paddingBottom={16} paddingHorizontal={60}>
        <Heading align="center" color="primary" size="xxlarge">
          NOTIFICATIONS
        </Heading>
      </Box>
      <Background pattern="dotted">
        <Box paddingHorizontal={60}>
          <Container>
            <Row>
              {notifications.map((notification, index) => (
                <Column key={index}>
                  <Box paddingBottom={24}>{notification}</Box>
                </Column>
              ))}
            </Row>
          </Container>
        </Box>
      </Background>
    </Box>
  );
};

export const MyAccount = () => {
  const [tab, setTab] = React.useState(MyAccountTab.QUESTION);
  const {
    data: notifications,
    loading: notificationsLoading,
  } = useNotifications();
  const {
    data: answeredQuestions,
    loading: answersLoading,
  } = useMyAnswersQuery();
  const { data: questions, loading: questionsLoading } = useMyQuestionsQuery();
  const { data: balance, loading: balanceLoading } = useBalanceQuery();
  const [seeAllNotifications, setSeeAllNotifications] = React.useState(false);

  if (
    notificationsLoading ||
    answersLoading ||
    questionsLoading ||
    balanceLoading
  ) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box>
      {!seeAllNotifications && (
        <Main
          tab={tab}
          setTab={setTab}
          onPressSeeAllNotifications={() => setSeeAllNotifications(true)}
          notifications={notifications}
          questions={questions}
          answeredQuestions={answeredQuestions}
          balance={balance}
        />
      )}
      {seeAllNotifications && (
        <AllNotifications
          notifications={notifications}
          onClose={() => setSeeAllNotifications(false)}
        />
      )}
    </Box>
  );
};
