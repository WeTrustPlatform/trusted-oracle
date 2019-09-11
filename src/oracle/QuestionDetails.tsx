import BigNumber from 'bn.js';
import { format, formatDistanceToNow, formatRelative } from 'date-fns';
import { useFormik } from 'formik';
import {
  Badge,
  Box,
  Collapsible,
  Divider,
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
import { useCurrency } from '../ethereum/CurrencyProvider';
import { formatCurrency, toBigNumber } from '../ethereum/CurrencyUtils';
import { useWeb3Dialogs } from '../ethereum/Web3DialogsProvider';
import { useWeb3 } from '../ethereum/Web3Provider';
import { useOracle } from './OracleProvider';
import { Answer, Question, QuestionState, QuestionType } from './Question';
import { useQuestionQuery } from './useQuestionQuery';

interface QuestionDetailsProps {
  questionId: string;
}

export const QuestionDetails = (props: QuestionDetailsProps) => {
  const { questionId } = props;
  const { data: question, loading, refetch } = useQuestionQuery(questionId);

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
        <QuestionSummary question={question} refetch={refetch} />
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
        paddingVertical={16}
      >
        <Box flexDirection="row" alignItems="center">
          <Box paddingRight={24}>
            <QuestionReward question={question} />
          </Box>
          <QuestionPostedDate question={question} />
        </Box>
        <QuestionBadge question={question} refetch={refetch} />
      </Box>
      {question.state !== QuestionState.FINALIZED && (
        <Box paddingVertical={16} paddingHorizontal={60}>
          <QuestionAddReward question={question} refetch={refetch} />
        </Box>
      )}
      <QuestionAnswers question={question} />

      {question.state !== QuestionState.FINALIZED && (
        <Background pattern="textured">
          <Box paddingVertical={24} paddingHorizontal={60}>
            <QuestionPostAnswer question={question} refetch={refetch} />
          </Box>
        </Background>
      )}
      {question.state !== QuestionState.FINALIZED && (
        <Background pattern="dotted">
          <Box paddingVertical={40} paddingHorizontal={60}>
            <QuestionApplyForArbitration
              question={question}
              refetch={refetch}
            />
          </Box>
        </Background>
      )}
    </Box>
  );
};

const UnsupportedQuestion = () => {
  return (
    <Box>
      <Text>
        Trusted Oracle does not support answering this type of question yet.
      </Text>
    </Box>
  );
};

const isSupported = (question: Question) => {
  return question.type === QuestionType.BINARY;
};

export interface QuestionBasicProps {
  question: Question;
}

export interface QuestionProps extends QuestionBasicProps {
  refetch: () => Promise<void>;
}

enum BooleanAnswer {
  YES = 'Yes',
  NO = 'No',
  INVALID = 'Invalid',
}

const binaryAnswerMap = {
  [BooleanAnswer.NO]:
    '0x0000000000000000000000000000000000000000000000000000000000000001',
  [BooleanAnswer.YES]:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  [BooleanAnswer.INVALID]:
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
} as const;

const toBinaryAnswer = (answer: string) => {
  switch (answer) {
    case binaryAnswerMap[BooleanAnswer.NO]:
      return BooleanAnswer.NO;
    case binaryAnswerMap[BooleanAnswer.YES]:
      return BooleanAnswer.YES;
    case binaryAnswerMap[BooleanAnswer.INVALID]:
      return BooleanAnswer.INVALID;
    default:
      throw new Error('Invalid binary answer');
  }
};

interface QuestionAnswerCardProps {
  order: React.ReactNode;
  answer: Answer;
}

const useAnswerColor = () => {
  return (answer: Answer) => {
    if (answer.answer === binaryAnswerMap[BooleanAnswer.YES]) {
      return '#17874f';
    }
    if (answer.answer === binaryAnswerMap[BooleanAnswer.INVALID]) {
      return '#eb7060';
    }

    return '#974d0c';
  };
};

const QuestionAnswerCard = (props: QuestionAnswerCardProps) => {
  const { answer, order } = props;
  const { currency } = useCurrency();
  const getAnswerColor = useAnswerColor();

  return (
    <Box>
      <Box flexDirection="row" alignItems="center" paddingVertical={16}>
        <Box flexBasis="20%">{order}</Box>
        <Box flex={1}>
          <Text
            weight="bold"
            color={getAnswerColor(answer)}
            transform="uppercase"
            size="large"
          >
            {toBinaryAnswer(answer.answer)}
          </Text>
        </Box>
        <Box flexBasis="20%" alignItems="flex-end">
          <Text>
            <Text size="small">
              Posted {formatDistanceToNow(answer.createdAtDate)} ago
            </Text>
          </Text>
        </Box>
      </Box>
      <Box flexDirection="row" alignItems="center" paddingBottom={16}>
        <Text>
          <Text weight="bold">User </Text>
          {answer.user}{' '}
        </Text>
        <Text>
          <Text weight="bold">Bond </Text>
          {formatCurrency(answer.bond, currency)} {currency}
        </Text>
      </Box>
    </Box>
  );
};

export const QuestionAnswers = (props: QuestionBasicProps) => {
  const { question } = props;
  const { answers } = question;

  if (!answers.length) return null;

  if (!isSupported(question)) return <UnsupportedQuestion />;

  if (question.finalizedAtDate === 'UNANSWERED') {
    throw new Error('Expected answers');
  }

  const [currentAnswer, ...previousAnswers] = answers.slice().reverse();

  return (
    <Box>
      <Background pattern="textured">
        <Box paddingHorizontal={60} paddingTop={16}>
          {question.state !== QuestionState.FINALIZED && (
            <Text weight="bold">
              Deadline {formatRelative(question.finalizedAtDate, new Date())}
            </Text>
          )}

          <QuestionAnswerCard
            answer={currentAnswer}
            order={
              question.state === QuestionState.FINALIZED ? (
                <Text size="large" weight="bold">
                  FINAL ANSWER:
                </Text>
              ) : (
                <Text size="large" weight="bold">
                  CURRENT ANSWER:
                </Text>
              )
            }
          />
        </Box>
      </Background>
      <Background pattern="dotted">
        <Box paddingHorizontal={60}>
          {previousAnswers.map((answer, index) => (
            <>
              <QuestionAnswerCard
                answer={answer}
                order={<Text weight="bold">ANSWER #{index + 1}:</Text>}
              />
              {index !== previousAnswers.length - 1 && <Divider />}
            </>
          ))}
        </Box>
      </Background>
    </Box>
  );
};

export const QuestionAddReward = (props: QuestionProps) => {
  const { question, refetch } = props;
  const [isOpen, setIsOpen] = React.useState(false);
  const { realitio } = useOracle();
  const { currency, approve } = useCurrency();
  const { account } = useWeb3();
  const { ensureHasConnected } = useWeb3Dialogs();
  const theme = useTheme();

  const {
    values,
    errors,
    touched,
    setFieldValue,
    submitForm,
    isSubmitting,
  } = useFormik({
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

    onSubmit: async (values, { setSubmitting, resetForm }) => {
      if (ensureHasConnected()) {
        const reward = toBigNumber(values.reward, currency);

        try {
          if (currency === 'ETH') {
            await realitio.fundAnswerBounty(question.id, {
              from: account,
              value: reward,
            });
          } else {
            await approve(realitio.address, reward);
            await realitio.fundAnswerBountyERC20(question.id, reward, {
              from: account,
            });
          }

          await refetch();
          resetForm();
        } catch (error) {
          console.log(error);
        }
      }

      setSubmitting(false);
    },
  });

  return (
    <Box alignItems="flex-start">
      <Collapsible
        title="Add Reward"
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        // eslint-disable-next-line
        // @ts-ignore: TODO fix in paramount-ui
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
                placeholder="Enter amount"
              />
            </FormField>
          </Box>
          <CTAButton
            isLoading={isSubmitting}
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
  const { question, refetch } = props;
  const theme = useTheme();
  const { realitio } = useOracle();
  const { account } = useWeb3();
  const { currency, approve } = useCurrency();
  const { ensureHasConnected } = useWeb3Dialogs();

  const {
    values,
    errors,
    touched,
    setFieldValue,
    submitForm,
    isSubmitting,
  } = useFormik({
    initialValues: {
      answer: 'UNSELECTED' as BooleanAnswer | 'UNSELECTED',
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

      if (!values.bond || values.bond === '') {
        errors.bond = 'Please enter a bond';
      } else if (
        toBigNumber(values.bond, currency).lt(
          question.bond.mul(new BigNumber(2)),
        )
      ) {
        errors.bond = `Bond must be equal or greater than ${formatCurrency(
          question.bond.mul(new BigNumber(2)),
          currency,
        )} ${currency}`;
      } else if (
        toBigNumber(values.bond, currency)
          .toString()
          .includes('undefined')
      ) {
        errors.bond = 'Invalid bond value. The value may be too small';
      }

      return errors;
    },

    onSubmit: async (values, { setSubmitting, resetForm }) => {
      if (ensureHasConnected()) {
        if (values.answer === 'UNSELECTED') throw new Error('Answer required');

        try {
          const bond = toBigNumber(values.bond, currency);

          if (currency === 'ETH') {
            await realitio.submitAnswer.sendTransaction(
              question.id,
              values.answer,
              question.bond,
              { from: account, value: bond },
            );
          } else {
            await approve(realitio.address, bond);
            await realitio.submitAnswerERC20.sendTransaction(
              question.id,
              values.answer,
              question.bond,
              bond,
              { from: account },
            );
          }

          resetForm();
          await refetch();
        } catch (error) {
          console.log(error);
        }
      }

      setSubmitting(false);
    },
  });

  if (!isSupported(question)) return <UnsupportedQuestion />;

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
              <NativePickerItem
                value={binaryAnswerMap[BooleanAnswer.YES]}
                label={BooleanAnswer.YES}
              />
              <NativePickerItem
                value={binaryAnswerMap[BooleanAnswer.NO]}
                label={BooleanAnswer.NO}
              />
              <NativePickerItem
                value={binaryAnswerMap[BooleanAnswer.INVALID]}
                label={BooleanAnswer.INVALID}
              />
            </NativePicker>
          </FormField>
        </Box>
        <Box paddingRight={16} flex={1}>
          <FormField
            label={`Bond ${
              question.bond && question.bond.toString() !== '0'
                ? `(minimum ${formatCurrency(
                    question.bond.mul(new BigNumber(2)),
                    currency,
                  )} ${currency})`
                : ''
            }`}
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
              placeholder="Enter amount"
            />
          </FormField>
        </Box>
        <Box flex={1}>
          <Box height={28} />
          <CTAButton
            isLoading={isSubmitting}
            onPress={submitForm}
            title="Post your Answer"
          />
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
  const { arbitratorContract } = useOracle();
  const { currency } = useCurrency();

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
  const { currency } = useCurrency();

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
