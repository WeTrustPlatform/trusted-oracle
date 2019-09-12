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

const useNotifications = () => {
  const { networkId, account } = useWeb3();
  const { realitio } = useOracle();
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
                <Box>
                  <Text>
                    You asked a question{' '}
                    {formatDistanceToNow(question.createdAtDate)} ago
                  </Text>
                </Box>
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
                  <Box>
                    <Text>
                      You committed to answering a question{' '}
                      {formatDistanceToNow(toDate(event.args.ts))} ago
                    </Text>
                  </Box>
                );
              } else {
                return (
                  <Box>
                    <Text>
                      You answered a question{' '}
                      {formatDistanceToNow(toDate(event.args.ts))} ago
                    </Text>
                  </Box>
                );
              }
            }

            if (answeredQuestion.user === account) {
              return (
                <Box>
                  <Text>
                    Someone answered your question{' '}
                    {formatDistanceToNow(toDate(event.args.ts))} ago
                  </Text>
                </Box>
              );
            } else if (
              answeredQuestion.answers
                .slice(1)
                .some(answer => answer.user === account)
            ) {
              return (
                <Box>
                  <Text>
                    Your answer was overwritten{' '}
                    {formatDistanceToNow(toDate(event.args.ts))} ago
                  </Text>
                </Box>
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
                <Box>
                  <Text>
                    You revealed an answer to a question{' '}
                    {formatDistanceToNow(new Date(answerRevealBlock.timestamp))}{' '}
                    ago
                  </Text>
                </Box>
              );
            }

            if (answerRevealedQuestion.user === account) {
              return (
                <Box>
                  <Text>
                    Someone revealed their answer to your question{' '}
                    {formatDistanceToNow(new Date(answerRevealBlock.timestamp))}{' '}
                    ago
                  </Text>
                </Box>
              );
            } else if (
              answerRevealedQuestion.answers
                .slice(1)
                .some(answer => answer.user === account)
            ) {
              return (
                <Box>
                  <Text>
                    Your answer was overwritten{' '}
                    {formatDistanceToNow(new Date(answerRevealBlock.timestamp))}{' '}
                    ago
                  </Text>
                </Box>
              );
            }

            return null;

          case OracleEventType.LogFundAnswerBounty:
            const rewardBlock = await fetchBlock(event.blockNumber);

            if (event.args.user === account) {
              return (
                <Box>
                  <Text>
                    You added reward{' '}
                    {formatDistanceToNow(new Date(rewardBlock.timestamp))} ago
                  </Text>
                </Box>
              );
            }

            const fundedQuestion = await fetchQuestion(event.args.question_id);
            if (!fundedQuestion) throw new Error('Question not found');

            if (fundedQuestion.user === account) {
              return (
                <Box>
                  <Text>
                    Someone added reward to your question{' '}
                    {formatDistanceToNow(new Date(rewardBlock.timestamp))} ago
                  </Text>
                </Box>
              );
            } else {
              if (
                fundedQuestion.answers.some(answer => answer.user === account)
              ) {
                return (
                  <Box>
                    <Text>
                      Someone added reward to the question you answered{' '}
                      {formatDistanceToNow(new Date(rewardBlock.timestamp))} ago
                    </Text>
                  </Box>
                );
              }
            }

            return null;

          case OracleEventType.LogNotifyOfArbitrationRequest:
            const arbitrationRequestBlock = await fetchBlock(event.blockNumber);

            if (event.args.user === account) {
              return (
                <Box>
                  <Text>
                    You requested arbitration{' '}
                    {formatDistanceToNow(
                      new Date(arbitrationRequestBlock.timestamp),
                    )}{' '}
                    ago
                  </Text>
                </Box>
              );
            }

            const arbitrationRequestedQuestion = await fetchQuestion(
              event.args.question_id,
            );
            if (!arbitrationRequestedQuestion)
              throw new Error('Question not found');

            if (arbitrationRequestedQuestion.user === account) {
              return (
                <Box>
                  <Text>
                    Someone requested arbitration to your question{' '}
                    {formatDistanceToNow(
                      new Date(arbitrationRequestBlock.timestamp),
                    )}{' '}
                    ago
                  </Text>
                </Box>
              );
            }

            if (
              arbitrationRequestedQuestion.answers.some(
                answer => answer.user === account,
              )
            ) {
              return (
                <Box>
                  <Text>
                    Someone requested arbitration to the question you answered{' '}
                    {formatDistanceToNow(
                      new Date(arbitrationRequestBlock.timestamp),
                    )}{' '}
                    ago
                  </Text>
                </Box>
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
                <Box>
                  <Text>
                    Your question is finalized{' '}
                    {formatDistanceToNow(new Date(finalizedBlock.timestamp))}{' '}
                    ago
                  </Text>
                </Box>
              );
            } else if (
              finalizedQuestion.answers.some(answer => answer.user === account)
            ) {
              return (
                <Box>
                  <Text>
                    The question you answered is finalized{' '}
                    {formatDistanceToNow(new Date(finalizedBlock.timestamp))}{' '}
                    ago
                  </Text>
                </Box>
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
}

const Main = (props: MainProps) => {
  const {
    questions,
    answeredQuestions,
    tab,
    notifications,
    setTab,
    onPressSeeAllNotifications,
  } = props;

  return (
    <Box>
      <Box paddingBottom={16} paddingHorizontal={60} paddingTop={40}>
        <Heading align="center" color="primary" size="xxlarge">
          MY ACCOUNT
        </Heading>
      </Box>
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
  const [seeAllNotifications, setSeeAllNotifications] = React.useState(false);

  if (notificationsLoading || answersLoading || questionsLoading) {
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
