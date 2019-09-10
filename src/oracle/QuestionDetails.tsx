import BigNumber from 'bn.js';
import { format, formatDistanceToNow } from 'date-fns';
import { useFormik } from 'formik';
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
  Theme,
  useTheme,
} from 'paramount-ui';
import React from 'react';
import { useAsync } from 'react-use';

import { Background } from '../components/Background';
import { CTAButton } from '../components/CTAButton';
import { WebImage } from '../components/WebImage';
import { formatCurrency } from './CurrencyUtils';
import { useOracle } from './OracleProvider';
import { Question, QuestionBasic, QuestionState } from './Question';
import { useQuestionQuery } from './useQuestionQuery';

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
      <Box
        paddingBottom={16}
        paddingHorizontal={60}
        flexDirection="row"
        justifyContent="space-between"
      >
        <QuestionTooltip question={question} />
        <QuestionSummary question={question} />
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

export interface QuestionBasicProps {
  question: QuestionBasic;
}

export const QuestionAddReward = (props: QuestionProps) => {
  const { question } = props;
  const [isOpen, setIsOpen] = React.useState(false);
  const theme = useTheme();
  const { values, errors, touched, setFieldValue, submitForm } = useFormik({
    initialValues: {
      reward: '',
    },

    validate: values => {
      const errors: {
        reward?: string;
      } = {};

      if (!values.reward) {
        errors.reward = 'Please enter a reward';
      }

      return errors;
    },

    onSubmit: async () => {},
  });

  return (
    <Box alignItems="flex-start">
      <Collapsible
        title="Add Reward"
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        // eslint-disable-next-line
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
            <FormField error={touched.reward && errors.reward}>
              <TextInput
                value={values.reward}
                keyboardType="number-pad"
                onChangeText={text => setFieldValue('reward', text)}
                placeholder="Enter TRST amount"
              />
            </FormField>
          </Box>
          <CTAButton
            onPress={submitForm}
            appearance="outline"
            title="Add Reward"
          />
        </Box>
      </Collapsible>
    </Box>
  );
};

export const QuestionPostAnswer = (props: QuestionProps) => {
  const { question } = props;
  const theme = useTheme();

  const { values, errors, touched, setFieldValue, submitForm } = useFormik({
    initialValues: {
      answer: 'UNSELECTED',
      bond: '',
    },

    validate: values => {
      const errors: {
        answer?: string;
        bond?: string;
      } = {};

      if (values.answer === 'UNSELECTED') {
        errors.answer = 'Please select an answer';
      }

      if (!values.bond) {
        errors.bond = 'Please enter a bond';
      }

      return errors;
    },

    onSubmit: async () => {},
  });

  if (question.type !== 'bool') {
    return (
      <Box>
        <Text>
          Trusted Oracle does not support answering this type of question yet.
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Box flexDirection="row">
        <Box paddingRight={16} flex={1}>
          <FormField
            label="Do you know the answer to this question?"
            getStyles={() => ({
              labelTextStyle: {
                color: theme.colors.text.primary,
                fontWeight: 'bold',
              },
            })}
            error={touched.answer && errors.answer}
          >
            <NativePicker
              selectedValue={values.answer}
              onValueChange={value => setFieldValue('answer', value)}
            >
              <NativePickerItem value="UNSELECTED" label="Select your answer" />
              <NativePickerItem value="YES" label="Yes" />
              <NativePickerItem value="NO" label="No" />
              <NativePickerItem value="INVALID" label="Invalid" />
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
            error={touched.bond && errors.bond}
          >
            <TextInput
              value={values.bond}
              keyboardType="number-pad"
              onChangeText={text => setFieldValue('bond', text)}
              placeholder="Enter TRST amount"
            />
          </FormField>
        </Box>
        <Box flex={1}>
          <Box height={28} />
          <CTAButton onPress={submitForm} title="Post your Answer" />
        </Box>
      </Box>
    </Box>
  );
};

export const getQuestionBadgeTitle = (question: Question) => {
  const { state, finalizedAtDate, openingDate } = question;

  if (state === QuestionState.FINALIZED && finalizedAtDate !== 'UNANSWERED') {
    return `RESOLVED ON ${format(finalizedAtDate, 'MMM d, yyyy')}`;
  }

  if (state === QuestionState.OPEN) {
    return 'OPEN FOR ANSWERS';
  }

  return `OPEN FOR ANSWERS ON ${format(openingDate, 'MMM d, yyyy')}`;
};

export const getQuestionBadgeColor = (question: Question, theme: Theme) => {
  const { state } = question;

  if (state === QuestionState.FINALIZED) {
    return theme.colors.text.default;
  }

  if (state === QuestionState.OPEN) {
    return theme.colors.text.primary;
  }

  return theme.colors.text.secondary;
};

export const QuestionBadge = (props: QuestionProps) => {
  const { question } = props;
  const theme = useTheme();

  return (
    <Badge
      size="small"
      shape="pill"
      title={getQuestionBadgeTitle(question)}
      getStyles={() => ({
        containerStyle: {
          borderWidth: 1,
          borderColor: getQuestionBadgeColor(question, theme),
          backgroundColor: theme.colors.background.content,
        },
        textStyle: {
          color: getQuestionBadgeColor(question, theme),
          fontSize: 14,
        },
      })}
    />
  );
};

export const QuestionApplyForArbitration = (props: QuestionProps) => {
  const { question } = props;
  const { arbitratorContract, currency } = useOracle();

  const { loading, value: disputeFee } = useAsync(async () => {
    if (!arbitratorContract) throw new Error('Expected arbitrator contract');

    const arbitrator = await arbitratorContract.at(question.arbitrator);
    const disputeFee = (await arbitrator.getDisputeFee.call(
      question.id,
    )) as BigNumber;

    return disputeFee;
  }, [arbitratorContract]);

  return (
    <Box>
      <Box paddingBottom={16} alignItems="center">
        <CTAButton
          isLoading={loading}
          appearance="outline"
          title={loading ? 'Loading dispute fee' : 'Apply for arbitration'}
        />
      </Box>
      {disputeFee && (
        <Box>
          <Text size="small" isItalic align="center">
            *Applying fee: {formatCurrency(disputeFee, currency)} {currency}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export const QuestionPostedDate = (props: QuestionBasicProps) => {
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

export const QuestionReward = (props: QuestionBasicProps) => {
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

export const QuestionTooltip = (props: QuestionBasicProps) => {
  return <Icon name="alert-circle" color="default" />;
};

export const QuestionSummary = (props: QuestionProps) => {
  return <Icon name="more-horizontal" color="default" />;
};
