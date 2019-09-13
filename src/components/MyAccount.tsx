import BigNumber from 'bn.js';
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
import { useAsyncFn } from 'react-use';

import { useCurrency } from '../ethereum/CurrencyProvider';
import { formatCurrency } from '../ethereum/CurrencyUtils';
import { useBalanceQuery } from '../ethereum/useBalanceQuery';
import { useWeb3 } from '../ethereum/Web3Provider';
import { useOracle } from '../oracle/OracleProvider';
import { Question } from '../oracle/Question';
import { QuestionCard } from '../oracle/QuestionList';
import { ClaimArguments, useClaimsQuery } from '../oracle/useClaimsQuery';
import { useMyAnswersQuery } from '../oracle/useMyAnswersQuery';
import { useMyQuestionsQuery } from '../oracle/useMyQuestionsQuery';
import { useNotificationsQuery } from '../oracle/useNotificationsQuery';
import { Background } from './Background';
import { Tabs } from './CustomTabs';

enum MyAccountTab {
  QUESTION = 'QUESTION',
  ANSWER = 'ANSWER',
}

interface ClaimableProps {
  claimable: BigNumber;
  claimArguments: ClaimArguments;
  refetch: () => Promise<void>;
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
    refetch,
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
          <Claimable
            refetch={refetch}
            claimArguments={claimArguments}
            claimable={claimable}
          />
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
  } = useNotificationsQuery();
  const {
    data: answeredQuestions,
    loading: answersLoading,
    refetch: refetchMyAnswers,
  } = useMyAnswersQuery();
  const { data: questions, loading: questionsLoading } = useMyQuestionsQuery();
  const {
    data: balance,
    loading: balanceLoading,
    refetch: refetchBalance,
  } = useBalanceQuery();
  const [seeAllNotifications, setSeeAllNotifications] = React.useState(false);
  const {
    data: { claimArguments, claimable },
    loading: claimsLoading,
    refetch: refetchClaims,
  } = useClaimsQuery(answeredQuestions);

  const refetch = React.useCallback(async () => {
    await refetchMyAnswers(); // this will also trigger claims refetch
    await refetchBalance();
  }, [refetchBalance, refetchClaims]);

  if (
    notificationsLoading ||
    answersLoading ||
    questionsLoading ||
    balanceLoading ||
    claimsLoading
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
          refetch={refetch}
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
