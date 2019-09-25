import QuestionUtils from '@realitio/realitio-lib/formatters/question.js';
import TemplateUtils from '@realitio/realitio-lib/formatters/template.js';
import BigNumber from 'bn.js';
import { useFormik } from 'formik';
import {
  Box,
  Column,
  FormField,
  Heading,
  NativePicker,
  NativePickerItem,
  Row,
  Text,
  TextInput,
  useLayout,
} from 'paramount-ui';
import React from 'react';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import { withRouter } from 'react-router';
import { useAsync } from 'react-use';

import { useCurrency } from '../ethereum/CurrencyProvider';
import { formatCurrency, toBigNumber } from '../ethereum/CurrencyUtils';
import { useBalanceQuery } from '../ethereum/useBalanceQuery';
import { useWeb3Dialogs } from '../ethereum/Web3DialogsProvider';
import { useWeb3 } from '../ethereum/Web3Provider';
import { Arbitrator, useOracle } from '../oracle/OracleProvider';
import { useStore } from '../oracle/StoreProvider';
import { Background } from './Background';
import { CTAButton } from './CTAButton';

export const Balance = () => {
  const { account, web3IsLoading } = useWeb3();
  const { currency } = useCurrency();
  const { data: balance } = useBalanceQuery();

  if (web3IsLoading) return null;

  if (!account) {
    return <Text weight="bold">Connect to wallet</Text>;
  }

  return (
    <Text color="primary" weight="bold">
      Your balance: {formatCurrency(balance, currency)}
    </Text>
  );
};

interface ArbitratorWithFee extends Arbitrator {
  fee: BigNumber;
}

export const AskQuestion = withRouter(props => {
  const { history } = props;
  const { getResponsiveValue } = useLayout();
  const { arbitratorContract, realitio, arbitratorList } = useOracle();
  const { getById } = useStore();
  const { account } = useWeb3();
  const { currency, approve } = useCurrency();
  const { ensureHasConnected } = useWeb3Dialogs();

  const { value: arbitratorListWithFees } = useAsync(async () => {
    try {
      if (!arbitratorContract || !realitio) {
        return arbitratorList.map(a => ({
          ...a,
          fee: new BigNumber(0),
        })) as ArbitratorWithFee[];
      }

      const arbitratorListWithFees = (await Promise.all(
        arbitratorList.map(async arbitrator => {
          const arbitratorInstance = await arbitratorContract.at(
            arbitrator.address,
          );

          const realitioAddress = await arbitratorInstance.realitio.call();

          if (
            realitio.address.toLowerCase() === realitioAddress.toLowerCase()
          ) {
            const fee = await realitio.arbitrator_question_fees.call(
              arbitrator.address,
            );

            return { ...arbitrator, fee };
          }

          return arbitrator;
        }),
      )) as ArbitratorWithFee[];

      return arbitratorListWithFees;
    } catch (error) {
      console.log(error);
      return arbitratorList.map(a => ({
        ...a,
        fee: new BigNumber(0),
      })) as ArbitratorWithFee[];
    }
  }, []);

  const {
    values,
    touched,
    errors,
    setFieldValue,
    submitForm,
    isSubmitting,
  } = useFormik({
    initialValues: {
      bounty: '',
      category: 'UNSELECTED',
      openingDate: '',
      questionTitle: '',
      arbitrator: 'UNSELECTED',
      arbitratorAddress: '',
      type: 'bool',
      timeout: '86400',
    },

    validate: () => {
      const errors: {
        category?: string;
        questionTitle?: string;
        arbitrator?: string;
        bounty?: string;
        openingDate?: string;
      } = {};

      if (values.category === 'UNSELECTED') {
        errors.category = 'Please select a category';
      }

      if (values.arbitrator === 'UNSELECTED') {
        errors.arbitrator = 'Please select an arbitrator';
      }

      if (values.questionTitle === '') {
        errors.questionTitle = 'Please enter your question';
      }

      if (
        currency === 'TRST' &&
        values.bounty &&
        toBigNumber(values.bounty, currency).lte(new BigNumber(0))
      ) {
        errors.bounty = 'Bounty for TRST must be greater than 0';
      }

      return errors;
    },

    onSubmit: async (values, { setSubmitting, setErrors }) => {
      if (!(await ensureHasConnected())) {
        setSubmitting(false);
        return;
      }

      const { category, questionTitle, type } = values;

      const timeout = Number(values.timeout);
      const question = QuestionUtils.encodeText(
        type,
        questionTitle,
        [''],
        category,
      );
      const arbitrator =
        values.arbitratorAddress !== ''
          ? values.arbitratorAddress
          : values.arbitrator;
      const arbitratorInstance = await arbitratorContract.at(arbitrator);

      const openingDate =
        values.openingDate === ''
          ? 0
          : //
            // @ts-ignore
            parseInt(values.openingDate.valueOf() / 1000);
      const bounty =
        values.bounty !== ''
          ? toBigNumber(values.bounty, currency)
          : new BigNumber(0);
      const templateId = TemplateUtils.defaultTemplateIDForType(type);
      const questionId = QuestionUtils.questionID(
        templateId,
        question,
        arbitrator,
        timeout,
        openingDate,
        account,
        0,
      );

      const realitioAddress = await arbitratorInstance.realitio.call();

      if (realitio.address.toLowerCase() !== realitioAddress.toLowerCase()) {
        setSubmitting(false);
        setErrors({ arbitrator: 'Bad arbitrator' });
        return;
      }

      if (!arbitratorListWithFees) {
        setSubmitting(false);
        setErrors({ arbitrator: 'Arbitrator data not loaded yet' });
        return;
      }
      const arbitratorInList = arbitratorListWithFees.find(
        arb => arb.address === arbitrator,
      );
      const expectedFee = arbitratorInList
        ? arbitratorInList.fee
        : new BigNumber(0);

      const fee = await realitio.arbitrator_question_fees.call(arbitrator);

      if (!expectedFee.eq(fee)) {
        setSubmitting(false);
        setErrors({ arbitrator: `Fee has changed to ${fee}` });
        return;
      }
      const cost = bounty.add(fee);

      if (currency === 'ETH') {
        await realitio.askQuestion.sendTransaction(
          templateId,
          question,
          arbitrator,
          timeout,
          openingDate,
          0,
          {
            from: account,
            value: cost.toString(),
          },
        );
      } else {
        await approve(realitio.address, cost);

        await realitio.askQuestionERC20.sendTransaction(
          templateId,
          question,
          arbitrator,
          timeout,
          openingDate,
          0,
          cost.toString(),
          { from: account },
        );
      }

      await getById(questionId);
      history.replace('/');
    },
  });

  return (
    <Box>
      <Box
        paddingBottom={16}
        {...getResponsiveValue({
          large: {
            paddingHorizontal: 60,
          },
          xsmall: {
            paddingHorizontal: 16,
          },
        })}
        paddingTop={40}
      >
        <Heading align="center" color="primary" size="xxlarge">
          ASK A QUESTION
        </Heading>
      </Box>
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
          paddingVertical={24}
          flexDirection="row"
          justifyContent="space-between"
        >
          <Balance />
        </Box>
      </Background>

      <Background pattern="dotted">
        <Box
          paddingTop={24}
          {...getResponsiveValue({
            large: {
              paddingHorizontal: 60,
            },
            xsmall: {
              paddingHorizontal: 16,
            },
          })}
        >
          <Box paddingBottom={24} zIndex={1}>
            <Row>
              <Column large={6}>
                <FormField
                  label="Category"
                  error={touched.category && errors.category}
                  description="Choosing an appropriate category helps users find questions to category."
                >
                  <NativePicker
                    selectedValue={values.category}
                    onValueChange={value => setFieldValue('category', value)}
                  >
                    <NativePickerItem
                      value="UNSELECTED"
                      label="Choose a category"
                    />
                    <NativePickerItem value="sports" label="Sports" />
                    <NativePickerItem value="politics" label="Politics" />
                    <NativePickerItem value="weather" label="Weather" />
                    <NativePickerItem value="blockchain" label="Blockchains" />
                    <NativePickerItem value="culture" label="Culture" />
                    <NativePickerItem
                      value="business-finance"
                      label="Business / Finance"
                    />
                    <NativePickerItem value="art-design" label="Art / Design" />
                    <NativePickerItem
                      value="technology-science"
                      label="Technology / Science"
                    />
                    <NativePickerItem value="misc" label="Miscellaneous" />
                  </NativePicker>
                </FormField>
              </Column>
              <Column large={6}>
                <FormField
                  label="Opening Date"
                  error={touched.openingDate && errors.openingDate}
                  description="The opening date is when answers can be posted. If the event has not yet taken place, the opening date should be set to after the event is supposed to happen."
                >
                  <DayPickerInput
                    placeholder="Choose a date"
                    format="yy-mm-dd"
                    value={values.openingDate}
                    onDayChange={date => setFieldValue('openingDate', date)}
                  />
                </FormField>
              </Column>
            </Row>
          </Box>
          <Box paddingBottom={24}>
            <Row>
              <Column>
                <FormField
                  label="Question"
                  error={touched.questionTitle && errors.questionTitle}
                >
                  <TextInput
                    value={values.questionTitle}
                    onChangeText={questionTitle =>
                      setFieldValue('questionTitle', questionTitle)
                    }
                    numberOfLines={2}
                  />
                </FormField>
              </Column>
            </Row>
          </Box>
          <Box paddingBottom={24}>
            <Row>
              <Column large={6}>
                <FormField
                  label="Question Type"
                  error={touched.type && errors.type}
                  description="Only binary answers now supported"
                >
                  <TextInput value="Binary" isDisabled />
                </FormField>
              </Column>
              <Column large={6}>
                <FormField
                  label={`Reward (${currency})`}
                  error={touched.bounty && errors.bounty}
                  description="The reward encourages others to answer the question. The final answer claims the reward. (You can also leave the reward as zero if you plan to supply the answer yourself, assuming it will survive challenges.)"
                >
                  <TextInput
                    value={values.bounty}
                    onChangeText={bounty => setFieldValue('bounty', bounty)}
                    keyboardType="number-pad"
                  />
                </FormField>
              </Column>
            </Row>
          </Box>
          <Box paddingBottom={24}>
            <Row>
              <Column large={6}>
                <FormField
                  label="Arbitrator"
                  error={
                    (touched.arbitrator && errors.arbitrator) ||
                    (touched.arbitratorAddress && errors.arbitratorAddress)
                  }
                  description="Empty field will use default arbitrator. Anyone who wants to challenge the final answer can request arbitration via Realitio, an Ethereum contract, or any other decision-making process you can code. The arbitrator assigns a cost for this service that is visible on the question page."
                >
                  <NativePicker
                    selectedValue={values.arbitrator}
                    onValueChange={value => {
                      if (value !== 'other') {
                        setFieldValue('arbitratorAddress', '');
                      }
                      setFieldValue('arbitrator', value);
                    }}
                  >
                    <NativePickerItem
                      value="UNSELECTED"
                      label="Select arbitrator"
                    />
                    {/* */}
                    {(arbitratorListWithFees || []).map(arbitrator => (
                      <NativePickerItem
                        key={arbitrator.address}
                        value={arbitrator.address}
                        label={
                          arbitrator.fee.gt(new BigNumber(0))
                            ? `${arbitrator.name} (Fee: ${formatCurrency(
                                arbitrator.fee,
                                currency,
                              )})`
                            : arbitrator.name
                        }
                      />
                    ))}
                    <NativePickerItem
                      value="other"
                      label="Other (Enter address)"
                    />
                  </NativePicker>
                  {values.arbitrator === 'other' && (
                    <Box paddingTop={16}>
                      <TextInput
                        placeholder="Enter address"
                        value={values.arbitratorAddress}
                        onChangeText={arbitratorAddress =>
                          setFieldValue('arbitratorAddress', arbitratorAddress)
                        }
                      />
                    </Box>
                  )}
                </FormField>
              </Column>
              <Column large={6}>
                <FormField
                  label="Countdown"
                  error={touched.timeout && errors.timeout}
                  description="The countdown period determines how long another answer can be posted after an answer. Each answer resets the the countdown period. The final unchallenged answer after the countdown period expires is the winner."
                >
                  <NativePicker
                    selectedValue={values.timeout}
                    onValueChange={value => setFieldValue('timeout', value)}
                  >
                    <NativePickerItem
                      value="30"
                      label="30 seconds (for testing)"
                    />
                    <NativePickerItem
                      value="180"
                      label="3 minutes (for testing or use by bots)"
                    />
                    <NativePickerItem value="3600" label="1 hour" />
                    <NativePickerItem value="10800" label="3 hours" />
                    <NativePickerItem value="43200" label="12 hours" />
                    <NativePickerItem value="86400" label="1 day" />
                    <NativePickerItem value="172800" label="2 days" />
                    <NativePickerItem value="259200" label="3 days" />
                    <NativePickerItem value="345600" label="4 days" />
                    <NativePickerItem value="432000" label="5 days" />
                    <NativePickerItem value="518400" label="6 days" />
                    <NativePickerItem value="604800" label="1 week" />
                  </NativePicker>
                </FormField>
              </Column>
            </Row>
          </Box>
          <Box
            {...getResponsiveValue({
              large: {
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
              },
            })}
          >
            <Box paddingBottom={24}>
              <CTAButton
                appearance="outline"
                title="Cancel"
                onPress={() => history.replace('/')}
              />
            </Box>
            <CTAButton
              title="Submit Question"
              onPress={submitForm}
              isLoading={isSubmitting}
            />
          </Box>
        </Box>
      </Background>
    </Box>
  );
});
