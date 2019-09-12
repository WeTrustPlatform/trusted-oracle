import { compareDesc } from 'date-fns';
import { isEmpty } from 'lodash';
import {
  Box,
  Column,
  Container,
  Divider,
  Heading,
  Row,
  Text,
  useTheme,
} from 'paramount-ui';
import React from 'react';

import { Background } from '../components/Background';
import { Tabs } from '../components/CustomTabs';
import { Link } from '../components/Link';
import { useWeb3 } from '../ethereum/Web3Provider';
import { Question, QuestionState } from './Question';
import {
  QuestionPostedDate,
  QuestionReward,
  QuestionTooltip,
  toBinaryAnswer,
  useAnswerColor,
} from './QuestionDetails';
import { useQuestionsQuery } from './useQuestionsQuery';

export interface QuestionCardProps {
  question: Question;
}

export const QuestionCard = (props: QuestionCardProps) => {
  const theme = useTheme();
  const { account } = useWeb3();
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
      <Box alignItems="flex-end" paddingRight={8} paddingTop={8}>
        <QuestionTooltip question={question} />
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
          <Box paddingBottom={24}>
            <QuestionReward question={question} />
          </Box>
          <QuestionPostedDate question={question} />
        </Box>
      </Box>
      <Box paddingTop={24}>
        {question.state !== QuestionState.NOT_OPEN && (
          <Background pattern="textured">
            <Box
              paddingVertical={16}
              paddingHorizontal={40}
              flexDirection="row"
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
      </Box>
    </Box>
  );
};

export enum QuestionCategory {
  LATEST = 'LATEST',
  CLOSING_SOON = 'CLOSING_SOON',
  HIGH_REWARD = 'HIGH_REWARD',
  RESOLVED = 'RESOLVED',
}

const sortQuestions = (questions: Question[], sort: QuestionCategory) => {
  switch (sort) {
    case QuestionCategory.LATEST:
      return questions
        .filter(q => q.state !== QuestionState.FINALIZED)
        .sort((a, b) => compareDesc(a.createdAtDate, b.createdAtDate));
    case QuestionCategory.CLOSING_SOON:
      return questions
        .filter(q => q.state !== QuestionState.FINALIZED)
        .sort((a, b) => {
          if (
            a.finalizedAtDate === 'UNANSWERED' ||
            b.finalizedAtDate === 'UNANSWERED'
          ) {
            return -1;
          }

          return compareDesc(a.finalizedAtDate, b.finalizedAtDate);
        });
    case QuestionCategory.HIGH_REWARD:
      return questions
        .filter(q => q.state !== QuestionState.FINALIZED)
        .sort((a, b) => b.bounty.sub(a.bounty).toNumber());
    case QuestionCategory.RESOLVED:
      return questions.filter(q => q.state === QuestionState.FINALIZED);
    default:
      return questions;
  }
};

export const QuestionList = () => {
  const { questions } = useQuestionsQuery();
  const [sort, setSort] = React.useState(QuestionCategory.LATEST);
  const sortedQuestions = sortQuestions(questions, sort);

  return (
    <Background pattern="dotted">
      <Box paddingVertical={60}>
        <Box paddingBottom={40}>
          <Heading align="center" color="secondary" size="xxxlarge">
            QUESTION LIST
          </Heading>
        </Box>
        <Box paddingBottom={40}>
          <Tabs
            // eslint-disable-next-line
            // @ts-ignore: we know that only QuestionCategory is passed in
            onChangeTab={setSort}
            currentValue={sort}
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
        <Container>
          <Row>
            {sortedQuestions.map(question => (
              <Column key={question.id}>
                <Box paddingBottom={24}>
                  <Link to={`/question/${question.id}`}>
                    <QuestionCard question={question} />
                  </Link>
                </Box>
              </Column>
            ))}
          </Row>
        </Container>
      </Box>
    </Background>
  );
};
