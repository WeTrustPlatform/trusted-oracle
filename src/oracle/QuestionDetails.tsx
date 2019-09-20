import BigNumber from 'bn.js';
import {
  compareDesc,
  format,
  formatDistanceToNow,
  formatRelative,
} from 'date-fns';
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
  Position,
  Text,
  TextInput,
  Theme,
  useLayout,
  useTheme,
} from 'paramount-ui';
import React from 'react';
import { useAsyncFn } from 'react-use';
import Web3 from 'web3';

import { Background } from '../components/Background';
import { CTAButton } from '../components/CTAButton';
import { Tooltip } from '../components/Tooltip';
import { WebImage } from '../components/WebImage';
import { useCurrency } from '../ethereum/CurrencyProvider';
import { formatCurrency, toBigNumber } from '../ethereum/CurrencyUtils';
import { useWeb3Dialogs } from '../ethereum/Web3DialogsProvider';
import { useWeb3 } from '../ethereum/Web3Provider';
import { useOracle } from './OracleProvider';
import { Answer, isSupported, Question, QuestionState } from './Question';
import { useStore } from './StoreProvider';
import { useQuestionQuery } from './useQuestionQuery';

interface QuestionDetailsProps {
  questionId: string;
}

export const QuestionDetails = (props: QuestionDetailsProps) => {
  const { questionId } = props;
  const { data: question, loading } = useQuestionQuery(questionId);
  const { getResponsiveValue } = useLayout();

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
    <Box backgroundColor="content">
      <Box
        paddingBottom={16}
        paddingTop={40}
        {...getResponsiveValue({
          large: {
            paddingHorizontal: 60,
          },
          xsmall: {
            paddingHorizontal: 16,
          },
        })}
      >
        <Heading align="center" color="primary" size="xxlarge">
          QUESTION DETAILS
        </Heading>
      </Box>
      <Box
        paddingBottom={16}
        flexDirection="row"
        justifyContent="space-between"
        zIndex={1}
        {...getResponsiveValue({
          large: {
            paddingHorizontal: 60,
          },
          xsmall: {
            paddingHorizontal: 16,
          },
        })}
      >
        <QuestionTooltip position="bottom-left" question={question} />
        <QuestionSummary question={question} />
      </Box>
      <Box
        paddingBottom={24}
        {...getResponsiveValue({
          large: {
            paddingHorizontal: 60,
          },
          xsmall: {
            paddingHorizontal: 16,
          },
        })}
      >
        <Text
          weight="bold"
          getStyles={() => ({
            textStyle: getResponsiveValue({
              xlarge: {
                fontSize: 32,
                lineHeight: 40,
              },
              xsmall: {
                fontSize: 24,
                lineHeight: 28,
              },
            }),
          })}
        >
          {question.questionTitle}
        </Text>
      </Box>
      <Box
        {...getResponsiveValue({
          large: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 60,
          },
          xsmall: {
            paddingHorizontal: 16,
          },
        })}
        paddingVertical={16}
      >
        <Box
          {...getResponsiveValue({
            large: {
              flexDirection: 'row',
              alignItems: 'center',
            },
            xsmall: {
              paddingBottom: 16,
            },
          })}
        >
          <Box
            {...getResponsiveValue({
              large: {
                paddingRight: 24,
              },
              xsmall: {
                paddingBottom: 16,
              },
            })}
          >
            <QuestionReward question={question} />
          </Box>
          <QuestionPostedDate question={question} />
        </Box>
        <QuestionBadge question={question} />
      </Box>
      {question.state === QuestionState.OPEN && (
        <Box
          paddingVertical={16}
          {...getResponsiveValue({
            large: {
              paddingHorizontal: 60,
            },
            xsmall: {
              paddingHorizontal: 16,
            },
          })}
        >
          <QuestionAddReward question={question} />
        </Box>
      )}
      <QuestionAnswers question={question} />

      {question.state === QuestionState.OPEN && (
        <Background pattern="textured">
          <Box
            paddingVertical={24}
            {...getResponsiveValue({
              large: {
                paddingHorizontal: 60,
              },
              xsmall: {
                paddingHorizontal: 16,
              },
            })}
          >
            <QuestionPostAnswer question={question} />
          </Box>
        </Background>
      )}
      {question.state === QuestionState.OPEN && (
        <Background pattern="dotted">
          <Box
            paddingVertical={40}
            {...getResponsiveValue({
              large: {
                paddingHorizontal: 60,
              },
              xsmall: {
                paddingHorizontal: 16,
              },
            })}
          >
            <QuestionApplyForArbitration question={question} />
          </Box>
        </Background>
      )}
    </Box>
  );
};

export const UnsupportedQuestion = () => {
  return (
    <Box>
      <Text>
        Trusted Oracle does not support answers to this type of question yet.
      </Text>
    </Box>
  );
};

export interface QuestionProps {
  question: Question;
}

enum BooleanAnswer {
  YES = 'Yes',
  NO = 'No',
  INVALID = 'Invalid',
  UNKNOWN = 'Unknown',
}

const binaryAnswerMap = {
  [BooleanAnswer.NO]:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  [BooleanAnswer.YES]:
    '0x0000000000000000000000000000000000000000000000000000000000000001',
  [BooleanAnswer.INVALID]:
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
} as const;

export const toBinaryAnswer = (answer: string) => {
  switch (answer) {
    case binaryAnswerMap[BooleanAnswer.NO]:
      return BooleanAnswer.NO;
    case binaryAnswerMap[BooleanAnswer.YES]:
      return BooleanAnswer.YES;
    case binaryAnswerMap[BooleanAnswer.INVALID]:
      return BooleanAnswer.INVALID;
    default:
      return BooleanAnswer.UNKNOWN;
  }
};

interface QuestionAnswerCardProps {
  order: React.ReactNode;
  answer: Answer;
}

export const useAnswerColor = () => {
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
  const { getResponsiveValue } = useLayout();
  const { currency } = useCurrency();
  const getAnswerColor = useAnswerColor();

  return (
    <Box>
      <Box
        {...getResponsiveValue({
          large: { flexDirection: 'row', alignItems: 'center' },
        })}
        paddingVertical={16}
      >
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
        <Box
          {...getResponsiveValue({
            large: { flexBasis: '20%', alignItems: 'flex-end' },
          })}
        >
          <Text>
            <Text size="small">
              Posted {formatDistanceToNow(answer.createdAtDate)} ago
            </Text>
          </Text>
        </Box>
      </Box>
      <Box
        {...getResponsiveValue({
          large: { flexDirection: 'row', alignItems: 'center' },
        })}
        paddingBottom={16}
      >
        <Text>
          <Text weight="bold">User </Text>
          {answer.user}{' '}
        </Text>
        <Text>
          <Text weight="bold">Bond </Text>
          {formatCurrency(answer.bond, currency)}
        </Text>
      </Box>
    </Box>
  );
};

export const QuestionAnswers = (props: QuestionProps) => {
  const { question } = props;
  const { answers } = question;
  const { getResponsiveValue } = useLayout();

  if (!answers.length) return null;

  if (!isSupported(question)) {
    return <UnsupportedQuestion />;
  }

  if (question.finalizedAtDate === 'UNANSWERED') {
    throw new Error('Expected answers');
  }

  const [currentAnswer, ...previousAnswers] = answers.sort((a, b) =>
    compareDesc(a.createdAtDate, b.createdAtDate),
  );

  return (
    <Box>
      <Background pattern="textured">
        <Box
          {...getResponsiveValue({
            large: {
              paddingHorizontal: 60,
            },
            xsmall: {
              paddingHorizontal: 16,
            },
          })}
          paddingTop={16}
        >
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
        <Box
          {...getResponsiveValue({
            large: {
              paddingHorizontal: 60,
            },
            xsmall: {
              paddingHorizontal: 16,
            },
          })}
        >
          {previousAnswers.map((answer, index) => (
            <Box key={String(answer.bond)}>
              <QuestionAnswerCard
                answer={answer}
                order={<Text weight="bold">ANSWER #{index + 1}:</Text>}
              />
              {index !== previousAnswers.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      </Background>
    </Box>
  );
};

export const QuestionAddReward = (props: QuestionProps) => {
  const { question } = props;
  const [isOpen, setIsOpen] = React.useState(false);
  const { realitio } = useOracle();
  const { currency, approve } = useCurrency();
  const { refetch } = useStore();
  const { account } = useWeb3();
  const { ensureHasConnected } = useWeb3Dialogs();
  const { getResponsiveValue } = useLayout();
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
      bounty: '',
    },

    validate: values => {
      const errors: {
        bounty?: string;
      } = {};

      if (!values.bounty) {
        errors.bounty = 'Please enter a bounty';
      }

      return errors;
    },

    onSubmit: async (values, { setSubmitting, resetForm }) => {
      if (ensureHasConnected()) {
        const bounty = toBigNumber(values.bounty, currency);

        try {
          if (currency === 'ETH') {
            await realitio.fundAnswerBounty(question.id, {
              from: account,
              value: bounty,
            });
          } else {
            await approve(realitio.address, bounty);
            await realitio.fundAnswerBountyERC20(question.id, bounty, {
              from: account,
            });
          }

          await refetch(question.id);
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
        <Box
          {...getResponsiveValue({
            xlarge: {
              flexDirection: 'row',
            },
          })}
        >
          <Box paddingRight={16}>
            <FormField error={touched.bounty && errors.bounty}>
              <TextInput
                value={values.bounty}
                keyboardType="number-pad"
                onChangeText={text => setFieldValue('bounty', text)}
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
  const { question } = props;
  const theme = useTheme();
  const { realitio } = useOracle();
  const { account } = useWeb3();
  const { currency, approve } = useCurrency();
  const { refetch } = useStore();
  const { ensureHasConnected } = useWeb3Dialogs();
  const { getResponsiveValue } = useLayout();

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
        )}`;
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
          await refetch(question.id);
        } catch (error) {
          console.log(error);
        }
      }

      setSubmitting(false);
    },
  });

  if (!isSupported(question)) {
    return <UnsupportedQuestion />;
  }

  return (
    <Box>
      <Box
        {...getResponsiveValue({
          xlarge: {
            flexDirection: 'row',
          },
        })}
      >
        <Box paddingRight={16} flex={1}>
          <FormField
            label="Do you know the answer to this question?"
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
                  )})`
                : ''
            }`}
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

  if (state === QuestionState.PENDING_ARBITRATION) {
    return 'AWAITING ARBITRATION';
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

  if (state === QuestionState.PENDING_ARBITRATION) {
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
  const { account } = useWeb3();
  const { ensureHasConnected } = useWeb3Dialogs();
  const { currency } = useCurrency();
  const { arbitratorContract } = useOracle();
  const { refetch } = useStore();

  const [{ loading }, handleApplyForArbitration] = useAsyncFn(async () => {
    if (!ensureHasConnected()) return;

    const arbitrator = await arbitratorContract.at(question.arbitrator);

    await arbitrator.requestArbitration(question.id, question.bond, {
      from: account,
      value: question.disputeFee,
    });

    await refetch(question.id);
  }, [arbitratorContract, question, account]);

  return (
    <Box>
      <Box paddingBottom={16} alignItems="center">
        <CTAButton
          isLoading={loading}
          appearance="outline"
          title="Apply for arbitration"
          onPress={handleApplyForArbitration}
        />
      </Box>
      <Box>
        <Text size="small" isItalic align="center">
          *Applying fee: {formatCurrency(question.disputeFee, currency)}
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

export const QuestionReward = (props: QuestionProps) => {
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
      <Text size="small">{formatCurrency(question.bounty, currency)}</Text>
    </Box>
  );
};

const smallNumberMap = {
  ETH: new BigNumber(Web3.utils.toWei('0.01')),
  TRST: new BigNumber(100 * 1000000),
};

export interface QuestionTooltipProps extends QuestionProps {
  position: Position;
}

export const QuestionTooltip = (props: QuestionTooltipProps) => {
  const { question, position } = props;
  const { currency } = useCurrency();

  let text = '';

  if (question.timeout.lt(new BigNumber(86400))) {
    text =
      'The timeout is very low. This means there may not be enough time for people to correct mistakes or lies. \n';
  }

  if (question.bounty.lt(smallNumberMap[currency])) {
    text +=
      'The bounty is very low. This means there may not be enough incentive to enter the correct answer and back it up with a bond.\n';
  }

  if (text === '') return <Box height={24} />;

  return (
    <Tooltip
      position={position}
      content={
        <Box width={400}>
          <Text>{text}</Text>
        </Box>
      }
    >
      <Icon name="alert-circle" color="default" />
    </Tooltip>
  );
};

const secondsTodHms = (sec: number) => {
  const d = Math.floor(sec / (3600 * 24));
  const h = Math.floor((sec % (3600 * 24)) / 3600);
  const m = Math.floor(((sec % (3600 * 24)) % 3600) / 60);
  const s = Math.floor(((sec % (3600 * 24)) % 3600) % 60);

  const dDisplay = d > 0 ? d + (d === 1 ? ' day ' : ' days ') : '';
  const hDisplay = h > 0 ? h + (h === 1 ? ' hour ' : ' hours ') : '';
  const mDisplay = m > 0 ? m + (m === 1 ? ' minute ' : ' minutes ') : '';
  const sDisplay = s > 0 ? s + (s === 1 ? ' second' : ' seconds') : '';

  return dDisplay + hDisplay + mDisplay + sDisplay;
};

export const QuestionSummary = (props: QuestionProps) => {
  const { question } = props;
  const { currency } = useCurrency();

  return (
    <Tooltip
      position="bottom-right"
      content={
        <Box width={400}>
          <Text size="small">
            Reward: {formatCurrency(question.bounty, currency)}
          </Text>
          <Box height={8} />
          <Text size="small">
            Highest bond: {formatCurrency(question.bond, currency)}
          </Text>
          <Box height={8} />
          <Text size="small">
            Timeout: {secondsTodHms(question.timeout.toNumber())}
          </Text>
          <Box height={8} />
          <Text size="small">Content hash: {question.contentHash}</Text>
          <Box height={8} />
          <Text size="small">Question ID: {question.id}</Text>
          <Box height={8} />
          <Text size="small">Arbitrator: {question.arbitrator}</Text>
          <Box height={8} />
          <Text size="small">Author: {question.user}</Text>
        </Box>
      }
    >
      <Icon name="more-horizontal" color="default" />
    </Tooltip>
  );
};
