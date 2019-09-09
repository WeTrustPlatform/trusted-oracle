import BigNumber from 'bn.js';
import { formatDistanceToNow } from 'date-fns';
import {
  Badge,
  Box,
  Collapsible,
  FormField,
  Heading,
  Icon,
  NativePicker,
  NativePickerItem,
  Text,
  TextInput,
  useTheme,
} from 'paramount-ui';
import React from 'react';
import Web3 from 'web3';

import { Currency, useOracle } from '../oracle/OracleProvider';
import { Question } from '../oracle/Question';
import { useQuestionQuery } from '../oracle/useQuestionQuery';
import { Background } from './Background';
import { CTAButton } from './CTAButton';
import { WebImage } from './WebImage';

interface QuestionDetailsProps {
  questionId: string;
}

export const QuestionDetails = (props: QuestionDetailsProps) => {
  const { questionId } = props;
  const { data: question, loading } = useQuestionQuery(questionId);

  if (loading) {
    return (
      <Box>
        <Text>Loading question</Text>
      </Box>
    );
  }

  if (!question) {
    return (
      <Box>
        <Text>Question could not be found</Text>
      </Box>
    );
  }
  return (
    <Box>
      <Box paddingBottom={16} paddingHorizontal={60} paddingTop={40}>
        <Heading align="center" color="primary" size="xxlarge">
          QUESTION DETAILS
        </Heading>
      </Box>
      <Box paddingBottom={16} paddingHorizontal={60}>
        <QuestionTooltip question={question} />
      </Box>
      <Box paddingBottom={24} paddingHorizontal={60}>
        <Text
          weight="bold"
          getStyles={() => ({
            textStyle: {
              fontSize: 32,
              lineHeight: 40,
            },
          })}
        >
          {question.questionTitle}
        </Text>
      </Box>
      <Box
        flexDirection="row"
        justifyContent="space-between"
        paddingHorizontal={60}
      >
        <Box flexDirection="row" alignItems="center">
          <Box paddingRight={24}>
            <QuestionReward question={question} />
          </Box>
          <QuestionPostedDate question={question} />
        </Box>
        <QuestionBadge question={question} />
      </Box>
      <Box paddingVertical={16} paddingHorizontal={60}>
        <QuestionAddReward question={question} />
      </Box>
      <Background pattern="textured">
        <Box paddingVertical={24} paddingHorizontal={60}>
          <QuestionPostAnswer question={question} />
        </Box>
      </Background>
      <Background pattern="dotted">
        <Box paddingVertical={40} paddingHorizontal={60}>
          <QuestionApplyForArbitration question={question} />
        </Box>
      </Background>
    </Box>
  );
};

export interface QuestionProps {
  question: Question;
}

export const QuestionAddReward = (props: QuestionProps) => {
  const { question } = props;
  const [isOpen, setIsOpen] = React.useState(false);
  const theme = useTheme();

  return (
    <Box alignItems="flex-start">
      <Collapsible
        title="Add Reward"
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        // @ts-ignore
        getStyles={() => ({
          textStyle: {
            fontSize: 20,
            color: theme.colors.text.link,
          },
          contentWrapperStyle: {
            paddingTop: 16,
          },
        })}
      >
        <Box flexDirection="row">
          <Box paddingRight={16}>
            <TextInput placeholder="Enter TRST amount" size="large" />
          </Box>
          <CTAButton appearance="outline" title="Add Reward" />
        </Box>
      </Collapsible>
    </Box>
  );
};

export const QuestionPostAnswer = (props: QuestionProps) => {
  const { question } = props;
  const theme = useTheme();

  return (
    <Box flexDirection="row" alignItems="center">
      <Box paddingRight={16} flex={1}>
        <FormField
          label="Do you know the answer to this question?"
          getStyles={() => ({
            labelTextStyle: {
              color: theme.colors.text.primary,
              fontWeight: 'bold',
            },
          })}
        >
          <NativePicker size="large">
            <NativePickerItem value="s" label="s" />
            <NativePickerItem value="d" label="s" />
          </NativePicker>
        </FormField>
      </Box>
      <Box paddingRight={16} flex={1}>
        <FormField
          label="Bond"
          getStyles={() => ({
            labelTextStyle: {
              color: theme.colors.text.primary,
              fontWeight: 'bold',
            },
          })}
        >
          <TextInput placeholder="Enter TRST amount" size="large" />
        </FormField>
      </Box>
      <Box flex={1}>
        <Box height={24} />
        <CTAButton title="Post your Answer" />
      </Box>
    </Box>
  );
};

export const QuestionBadge = (props: QuestionProps) => {
  const { question } = props;
  const theme = useTheme();

  return (
    <Badge
      size="small"
      shape="pill"
      title="Opening for answers"
      getStyles={() => ({
        containerStyle: {
          borderWidth: 1,
          borderColor: theme.colors.text.primary,
          backgroundColor: theme.colors.background.content,
        },
        textStyle: {
          color: theme.colors.text.primary,
          fontSize: 14,
        },
      })}
    />
  );
};

export const QuestionApplyForArbitration = (props: QuestionProps) => {
  const { question } = props;

  return (
    <Box>
      <Box paddingBottom={16}>
        <Text align="center">You're interested in this Question?</Text>
        <Text align="center">
          Let’s apply as an arbitrator* to give your Answer to this Question on
          _______
        </Text>
      </Box>
      <Box paddingBottom={16} alignItems="center">
        <CTAButton appearance="outline" title="Apply for arbitration" />
      </Box>
      <Box>
        <Text size="small" isItalic align="center">
          *Applying fee: _____
        </Text>
      </Box>
    </Box>
  );
};

export const QuestionPostedDate = (props: QuestionProps) => {
  const { question } = props;

  return (
    <Box flexDirection="row">
      <Box paddingRight={8}>
        <WebImage
          alt="card posted icon"
          src={require('../assets/images/card-posted.svg')}
        />
      </Box>
      <Text size="small">
        Posted {formatDistanceToNow(question.createdAtDate)} ago
      </Text>
    </Box>
  );
};

const currencyInfoMap = {
  ETH: {
    decimals: new BigNumber('1000000000000000000'),
    smallNumber: 0.01 * 1000000000000000000,
  },
  TRST: {
    decimals: new BigNumber('1000000'),
    smallNumber: 100 * 1000000,
  },
};

function formatCurrency(bigNumber: BigNumber, currency: Currency = 'TRST') {
  if (currency !== 'ETH') {
    return bigNumber.div(currencyInfoMap[currency].decimals).toNumber();
  }

  return Web3.utils.fromWei(bigNumber.toNumber(), 'ether');
}

export const QuestionReward = (props: QuestionProps) => {
  const { question } = props;
  const { currency } = useOracle();

  return (
    <Box flexDirection="row">
      <Box paddingRight={8}>
        <WebImage
          alt="card trst icon"
          src={require('../assets/images/card-trst.svg')}
        />
      </Box>
      <Text size="small">
        {formatCurrency(question.bounty, currency)} {currency}
      </Text>
    </Box>
  );
};

export const QuestionTooltip = (props: QuestionProps) => {
  return <Icon name="alert-circle" color="default" />;
};
