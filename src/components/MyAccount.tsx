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
import { useAsync, useAsyncFn } from 'react-use';
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
import {
  INITIAL_BLOCKS,
  Question,
  QuestionState,
  toDate,
} from '../oracle/Question';
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
  const { networkId, account, web3IsLoading } = useWeb3();
  const { realitio, loading: oracleLoading } = useOracle();
  const { currency, isCurrencyLoading } = useCurrency();
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
          case OracleEventType.LogClaim:
            if (event.args.user === account) {
              const claimedBlock = await fetchBlock(event.blockNumber);
              const claimedQuestion = await fetchQuestion(
                event.args.question_id,
              );

              if (!claimedQuestion) throw new Error('Question not found');

              return (
                <Notification
                  questionId={claimedQuestion.id}
                  date={timeAgo(claimedBlock)}
                  questionTitle={claimedQuestion.questionTitle}
                  message={`You claimed ${formatCurrency(
                    event.args.amount,
                    currency,
                  )} ${currency}`}
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
    loading: loading || isCurrencyLoading || oracleLoading || web3IsLoading,
    data: value || [],
  };
};

const useMakeQuestionClaim = () => {
  const { account } = useWeb3();

  const makeQuestionClaim = React.useCallback(
    (question: Question) => {
      let total = new BigNumber(0);

      if (
        new BigNumber(question.historyHash.substring(2)).eq(new BigNumber(0))
      ) {
        return null;
      }

      if (question.state !== QuestionState.FINALIZED) return null;

      const questionIds = [];
      const answerLengths = [];
      const bonds = [];
      const answers = [];
      const answerers = [];
      const historyHashes = [];

      let isFirst = true;
      let isYours = false;

      for (let i = question.answers.length - 1; i >= 0; i--) {
        // TODO: Check the history hash, and if we haven't reached it, keep going until we do
        // ...since someone may have claimed partway through

        const { answer, bond, user: answerer, historyHash } = question.answers[
          i
        ];
        // TODO: support answer commitments
        // Only set on reveal, otherwise the answer field still holds the commitment ID for commitments
        // if (question_detail['history'][i].args.commitment_id) {
        //   answer = question_detail['history'][i].args.commitment_id;
        // } else {
        //   answer = question_detail['history'][i].args.answer;
        // }

        if (isYours) {
          // Somebody takes over your answer
          if (answerer !== account && question.bestAnswer === answer) {
            isYours = false;
            total = total.sub(bond); // pay them their bond
          } else {
            total = total.add(bond); // take their bond
          }
        } else {
          // You take over someone else's answer
          if (answerer === account && question.bestAnswer === answer) {
            isYours = true;
            total = total.add(bond); // your bond back
          }
        }

        if (isFirst && isYours) {
          total = total.add(question.bounty);
        }

        bonds.push(bond);
        answers.push(answer);
        answerers.push(answerer);
        historyHashes.push(historyHash);

        isFirst = false;
      }

      // Nothing for you to claim, so return nothing
      if (!total.gt(new BigNumber(0))) {
        return null;
      }

      questionIds.push(question.id);
      answerLengths.push(bonds.length);

      // For the history hash, each time we need to provide the previous hash in the history
      // So delete the first item, and add 0x0 to the end.
      historyHashes.shift();
      historyHashes.push('0x0');

      // TODO: Someone may have claimed partway, so we should really be checking against the contract state

      return {
        total,
        questionIds,
        answerLengths,
        answers,
        answerers,
        bonds,
        historyHashes,
      };
    },
    [account],
  );

  return makeQuestionClaim;
};

enum MyAccountTab {
  QUESTION = 'QUESTION',
  ANSWER = 'ANSWER',
}

interface ClaimArguments {
  questionIds: string[];
  answerLengths: number[];
  answers: string[];
  answerers: string[];
  bonds: BigNumber[];
  historyHashes: string[];
}

const useMyAnswersQuery = () => {
  const { networkId, account } = useWeb3();
  const { realitio, loading: oracleLoading } = useOracle();
  const fetchQuestion = useFetchQuestionQuery();
  const makeQuestionClaim = useMakeQuestionClaim();
  const initialBlock = INITIAL_BLOCKS[networkId];

  const { loading, value } = useAsync(async () => {
    const events = (await realitio.getPastEvents(OracleEventType.LogNewAnswer, {
      fromBlock: initialBlock,
      toBlock: 'latest',
      filter: { user: account },
    })) as NewAnswerEvent[];

    const uniqueEvents = uniqBy(events, event => event.args.question_id);

    const questions = (await Promise.all(
      uniqueEvents.map(async event => fetchQuestion(event.args.question_id)),
    )).filter(Boolean) as Question[];

    let claimable = new BigNumber(0);

    const claimArguments: ClaimArguments = {
      questionIds: [],
      answerLengths: [],
      answers: [],
      answerers: [],
      bonds: [],
      historyHashes: [],
    };

    questions.map(makeQuestionClaim).forEach(claim => {
      if (claim) {
        claimable = claimable.add(claim.total);

        claimArguments.questionIds.push(...claim.questionIds);
        claimArguments.answerLengths.push(...claim.answerLengths);
        claimArguments.answers.push(...claim.answers);
        claimArguments.answerers.push(...claim.answerers);
        claimArguments.bonds.push(...claim.bonds);
        claimArguments.historyHashes.push(...claim.historyHashes);
      }
    });

    return {
      questions,
      claimArguments,
      claimable,
    };
  }, [realitio]);

  return {
    loading: loading || oracleLoading,
    data: value || {
      questions: [],
      claimArguments: {
        txids: [],
        total: new BigNumber(0),
        questionIds: [],
        answerLengths: [],
        answers: [],
        answerers: [],
        bonds: [],
        historyHashes: [],
      },
      claimable: new BigNumber(0),
    },
  };
};

const useMyQuestionsQuery = () => {
  const { networkId, account } = useWeb3();
  const { realitio, loading: oracleLoading } = useOracle();
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
    loading: loading || oracleLoading,
    data: value || [],
  };
};

const useBalanceQuery = () => {
  const { account, web3, web3IsLoading } = useWeb3();
  const { currency, tokenInstance, isCurrencyLoading } = useCurrency();

  const { value, loading } = useAsync(async () => {
    if (!account) throw new Error('Expected account');

    const balance = await (currency === 'ETH'
      ? web3.eth.getBalance(account)
      : tokenInstance.balanceOf.call(account));

    return balance as BigNumber;
  }, [account, web3, currency, tokenInstance]);

  return {
    data: value || new BigNumber(0),
    loading: loading || web3IsLoading || isCurrencyLoading,
  };
};

interface ClaimableProps {
  claimable: BigNumber;
  claimArguments: ClaimArguments;
}

const Claimable = (props: ClaimableProps) => {
  const { claimable, claimArguments } = props;
  const { realitio } = useOracle();
  const { currency } = useCurrency();
  const { account } = useWeb3();

  const [{ loading }, handleClaim] = useAsyncFn(async () => {
    // estimateGas gives us a number that credits the eventual storage refund.
    // However, this is only supplied at the end of the transaction, so we need to send more to get us to that point.
    // MetaMask seems to add a bit extra, but it's not enough.
    // Get the number via estimateGas, then add 60000 per question, which should be the max storage we free.

    // For now hard-code a fairly generous allowance
    // Tried earlier with single answerer:
    //  1 answer 48860
    //  2 answers 54947
    //  5 answers 73702
    const gas = 140000 + 30000 * claimArguments.historyHashes.length;

    await realitio.claimMultipleAndWithdrawBalance.sendTransaction(
      claimArguments.questionIds,
      claimArguments.answerLengths,
      claimArguments.historyHashes,
      claimArguments.answerers,
      claimArguments.bonds,
      claimArguments.answers,
      { from: account, gas },
    );
  }, [account, realitio, claimArguments]);

  if (claimable.eq(new BigNumber(0))) return null;

  return (
    <Box>
      <TouchableOpacity onPress={handleClaim}>
        {loading ? (
          <Text color="secondary">Loading...</Text>
        ) : (
          <Text color="secondary">
            Claim {formatCurrency(claimable, currency)} {currency}
          </Text>
        )}
      </TouchableOpacity>
    </Box>
  );
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

interface MainProps extends NotificationsPreviewProps, ClaimableProps {
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
    claimArguments,
    claimable,
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
        <Box
          paddingHorizontal={60}
          paddingVertical={24}
          flexDirection="row"
          justifyContent="space-between"
        >
          <Text color="primary" weight="bold">
            Your balance: {formatCurrency(balance, currency)} {currency}
          </Text>
          <Claimable claimArguments={claimArguments} claimable={claimable} />
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
    data: { questions: answeredQuestions, claimArguments, claimable },
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
          claimArguments={claimArguments}
          claimable={claimable}
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
