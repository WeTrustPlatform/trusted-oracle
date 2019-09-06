import BigNumber from 'bn.js';
import { formatDistanceToNow } from 'date-fns';
import {
  Box,
  Column,
  Container,
  Divider,
  Icon,
  Row,
  Text,
  useTheme,
} from 'paramount-ui';
import React from 'react';
import { ImageBackground } from 'react-native';
import Web3 from 'web3';

import { Currency, useOracle } from '../oracle/OracleProvider';
import { Question, useQuestionsQuery } from '../oracle/useQuestionsQuery';
import { WebImage } from './WebImage';

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

interface QuestionCardProps {
  question: Question;
}

const QuestionCard = (props: QuestionCardProps) => {
  const { currency } = useOracle();
  const theme = useTheme();
  const { question } = props;

  return (
    <Box
      backgroundColor="white"
      borderWidth={1}
      paddingBottom={40}
      borderColor={theme.colors.border.default}
      borderRadius={8}
    >
      <Box alignItems="flex-end" padding={10}>
        <Icon name="alert-circle" color="default" />
      </Box>
      <Box flexDirection="row" alignItems="center" paddingHorizontal={40}>
        <Box flex={1} paddingRight={24}>
          <Text weight="bold" size="large">
            {question.questionTitle}
          </Text>
        </Box>
        <Divider
          position="vertical"
          getStyles={() => ({ dividerStyle: { height: 70 } })}
        />
        <Box flexBasis="15%" paddingLeft={24}>
          <Box flexDirection="row" paddingBottom={24}>
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
        </Box>
      </Box>
    </Box>
  );
};

export const QuestionList = () => {
  const { loading, questions } = useQuestionsQuery();

  console.log(questions);

  return (
    <ImageBackground
      source={{ uri: require('../assets/images/dotted-bg.png') }}
    >
      <Box paddingVertical={60}>
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
          {loading && (
            <Row>
              <Column>
                <Text>Loading...</Text>
              </Column>
            </Row>
          )}
        </Container>
      </Box>
    </ImageBackground>
  );
};
