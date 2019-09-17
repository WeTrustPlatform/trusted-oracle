import BigNumber from 'bn.js';
import { Box, Column, Container, Heading, Row, Text } from 'paramount-ui';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { withRouter } from 'react-router';
import { useAsync, useAsyncFn } from 'react-use';

import { useCurrency } from '../ethereum/CurrencyProvider';
import { formatCurrency } from '../ethereum/CurrencyUtils';
import { useBalanceQuery } from '../ethereum/useBalanceQuery';
import { useWeb3 } from '../ethereum/Web3Provider';
import { useOracle } from '../oracle/OracleProvider';
import { QuestionCard } from '../oracle/QuestionList';
import { useStore } from '../oracle/StoreProvider';
import { useClaimsQuery } from '../oracle/useClaimsQuery';
import { useMyAnswersQuery } from '../oracle/useMyAnswersQuery';
import { useMyQuestionsQuery } from '../oracle/useMyQuestionsQuery';
import { Background } from './Background';
import { Tabs } from './CustomTabs';
import { Notification } from './Notifications';

const Claimable = () => {
  const { realitio } = useOracle();
  const { currency } = useCurrency();
  const { account } = useWeb3();
  const {
    data: answeredQuestions,
    loading: answersLoading,
  } = useMyAnswersQuery();
  const {
    data: { claimArguments, claimable },
    loading: claimsLoading,
  } = useClaimsQuery(answeredQuestions);
  const { refetchIds } = useStore();

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

    // Fetching one will trigger cache refresh throughout application
    refetchIds(claimArguments.questionIds);
  }, [account, realitio, claimArguments]);

  if (claimsLoading || answersLoading) return null;
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

const NotificationPreview = withRouter(props => {
  const { history } = props;
  const { notifications, getNotifications } = useStore();

  useAsync(async () => {
    getNotifications();
  }, [getNotifications]);

  if (!notifications.length) return null;

  return (
    <Box>
      <Box flexDirection="row" justifyContent="space-between">
        <Text weight="bold" color="primary">
          Latest activity
        </Text>
        <TouchableOpacity onPress={() => history.replace('/notifications')}>
          <Text color="secondary">See all</Text>
        </TouchableOpacity>
      </Box>
      {notifications.slice(0, 1).map((notification, index) => (
        <Box key={index}>
          <Notification {...notification} />
        </Box>
      ))}
    </Box>
  );
});

const Balance = () => {
  const { currency } = useCurrency();
  const { data: balance, loading: balanceLoading } = useBalanceQuery();

  if (balanceLoading) return <Text>Loading...</Text>;

  return (
    <Text color="primary" weight="bold">
      Your balance: {formatCurrency(balance, currency)} {currency}
    </Text>
  );
};

enum MyAccountTab {
  QUESTION = 'QUESTION',
  ANSWER = 'ANSWER',
}

const MyAnswers = () => {
  const {
    data: answeredQuestions,
    loading: answersLoading,
  } = useMyAnswersQuery();

  if (answersLoading) return <Text>Loading...</Text>;

  return (
    <Container>
      <Row>
        {answeredQuestions.map(question => (
          <Column key={question.id}>
            <Box paddingBottom={24}>
              <QuestionCard question={question} />
            </Box>
          </Column>
        ))}
      </Row>
    </Container>
  );
};

const MyQuestions = () => {
  const { data: questions, loading: questionsLoading } = useMyQuestionsQuery();

  if (questionsLoading) return <Text>Loading...</Text>;

  return (
    <Container>
      <Row>
        {questions.map(question => (
          <Column key={question.id}>
            <Box paddingBottom={24}>
              <QuestionCard question={question} />
            </Box>
          </Column>
        ))}
      </Row>
    </Container>
  );
};

export const MyAccount = () => {
  const [tab, setTab] = React.useState(MyAccountTab.QUESTION);

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
          <Balance />
          <Claimable />
        </Box>
      </Background>
      <Box paddingHorizontal={60} paddingVertical={24}>
        <NotificationPreview />
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
          {tab === MyAccountTab.ANSWER ? <MyAnswers /> : <MyQuestions />}
        </Box>
      </Background>
    </Box>
  );
};
