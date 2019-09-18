import { isEmpty } from 'lodash';
import {
  Box,
  Container,
  Divider,
  Heading,
  Text,
  useLayout,
  useTheme,
} from 'paramount-ui';
import React from 'react';

import { Background } from '../components/Background';
import { CTAButton } from '../components/CTAButton';
import { Tabs } from '../components/CustomTabs';
import { Link } from '../components/Link';
import { useWeb3 } from '../ethereum/Web3Provider';
import { isSupported, Question, QuestionState } from './Question';
import {
  QuestionPostedDate,
  QuestionReward,
  QuestionTooltip,
  toBinaryAnswer,
  UnsupportedQuestion,
  useAnswerColor,
} from './QuestionDetails';
import { QuestionCategory, useQuestionsQuery } from './useQuestionsQuery';

export interface QuestionCardProps {
  question: Question;
}

export const QuestionCard = (props: QuestionCardProps) => {
  const theme = useTheme();
  const { account } = useWeb3();
  const { getResponsiveValue } = useLayout();
  const answerColor = useAnswerColor();
  const { question } = props;

  const answers = question.answers.slice().reverse();
  const myAnswer = answers.find(answer => answer.user === account);

  return (
    <Box
      backgroundColor="white"
      borderWidth={1}
      borderColor={theme.colors.border.default}
      borderRadius={8}
    >
      <Box alignItems="flex-end" paddingRight={8} paddingTop={8} zIndex={1}>
        <QuestionTooltip position="bottom-right" question={question} />
      </Box>
      <Box
        {...getResponsiveValue({
          large: {
            flexDirection: 'row',
            alignItems: 'center',
          },
        })}
        paddingHorizontal={40}
      >
        <Box flex={1} paddingRight={24}>
          <Text weight="bold" size="large">
            {question.questionTitle}
          </Text>
        </Box>
        <Divider
          position={getResponsiveValue({
            large: 'vertical',
            xsmall: 'horizontal',
          })}
          getStyles={() => ({
            dividerStyle: getResponsiveValue({
              large: { height: 70 },
              xsmall: {
                marginTop: 24,
              },
            }),
          })}
        />
        <Box
          {...getResponsiveValue({
            large: {
              flexBasis: '15%',
              paddingLeft: 24,
            },
            xsmall: {
              paddingTop: 24,
            },
          })}
        >
          <Box paddingBottom={24}>
            <QuestionReward question={question} />
          </Box>
          <QuestionPostedDate question={question} />
        </Box>
      </Box>
      <Box paddingTop={24}>
        {question.state !== QuestionState.NOT_OPEN && isSupported(question) && (
          <Background pattern="textured">
            <Box
              paddingVertical={16}
              paddingHorizontal={40}
              {...getResponsiveValue({
                large: {
                  flexDirection: 'row',
                },
              })}
              justifyContent="space-between"
            >
              {isEmpty(answers) && (
                <Text size="large" weight="bold">
                  OPEN FOR ANSWERS
                </Text>
              )}
              {question.state === QuestionState.FINALIZED ? (
                <Text size="large" weight="bold">
                  FINAL ANSWER:{' '}
                  <Text
                    size="large"
                    weight="bold"
                    color={answerColor(answers[0])}
                  >
                    {toBinaryAnswer(answers[0].answer).toUpperCase()}
                  </Text>
                </Text>
              ) : isEmpty(answers) ? null : (
                <Text size="large" weight="bold">
                  {answers.length} {answers.length === 1 ? 'ANSWER' : 'ANSWERS'}
                </Text>
              )}
              {myAnswer && (
                <Text size="large" weight="bold">
                  MY ANSWER:{' '}
                  <Text
                    size="large"
                    weight="bold"
                    color={answerColor(myAnswer)}
                  >
                    {toBinaryAnswer(myAnswer.answer).toUpperCase()}
                  </Text>
                </Text>
              )}
            </Box>
          </Background>
        )}
        {!isSupported(question) && (
          <Background pattern="textured">
            <Box
              paddingVertical={16}
              paddingHorizontal={40}
              flexDirection="row"
              justifyContent="space-between"
            >
              <UnsupportedQuestion />
            </Box>
          </Background>
        )}
      </Box>
    </Box>
  );
};

export const QuestionList = () => {
  const [first, setFirst] = React.useState(8);
  const [category, setCategory] = React.useState(QuestionCategory.LATEST);
  const { data: questions, loading, total } = useQuestionsQuery({
    first,
    category,
  });

  return (
    <Background pattern="dotted">
      <Box paddingVertical={60}>
        <Box paddingBottom={40}>
          <Heading align="center" color="secondary" size="xxxlarge">
            QUESTION LIST
          </Heading>
        </Box>
        <Container>
          <Box paddingBottom={40}>
            <Tabs
              onChangeTab={category => {
                // eslint-disable-next-line
                // @ts-ignore: we know that only QuestionCategory is passed in
                setCategory(category);
                setFirst(8);
              }}
              currentValue={category}
              tabs={[
                {
                  label: 'LATEST',
                  value: QuestionCategory.LATEST,
                },
                {
                  label: 'CLOSING SOON',
                  value: QuestionCategory.CLOSING_SOON,
                },
                {
                  label: 'HIGH REWARD',
                  value: QuestionCategory.HIGH_REWARD,
                },
                {
                  label: 'RESOLVED',
                  value: QuestionCategory.RESOLVED,
                },
              ]}
            />
          </Box>
          {questions.map(question => (
            <Box key={question.id} paddingBottom={24}>
              <Link to={`/question/${question.id}`}>
                <QuestionCard question={question} />
              </Link>
            </Box>
          ))}

          {loading && first > total && <Text>Loading...</Text>}

          {first < total && (
            <Box alignItems="center">
              <CTAButton
                appearance="outline"
                title="View more"
                onPress={() => setFirst(first + 8)}
              />
            </Box>
          )}
        </Container>
      </Box>
    </Background>
  );
};
