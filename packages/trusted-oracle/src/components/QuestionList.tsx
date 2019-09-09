import { compareDesc } from 'date-fns';
import {
  Box,
  Column,
  Container,
  Dialog,
  Divider,
  Heading,
  Icon,
  Row,
  Text,
  useLayout,
  useTheme,
} from 'paramount-ui';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Route, RouteChildrenProps } from 'react-router';

import { isFinalized, QuestionBasic } from '../oracle/Question';
import { useQuestionsQuery } from '../oracle/useQuestionsQuery';
import { Background } from './Background';
import { Link } from './Link';
import {
  QuestionDetails,
  QuestionPostedDate,
  QuestionReward,
  QuestionTooltip,
} from './QuestionDetails';

interface QuestionCardProps {
  question: QuestionBasic;
}

const QuestionCard = (props: QuestionCardProps) => {
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
    </Box>
  );
};

const QuestionDetailsDialog = (
  props: RouteChildrenProps<{ questionId: string }>,
) => {
  const { history, match } = props;
  const layout = useLayout();

  if (!match) return null;

  return (
    <Dialog
      isVisible
      onRequestClose={() => history.replace('/')}
      getStyles={() => ({
        containerStyle: {
          width: '100%',
          maxWidth: layout.containerSizes.xlarge,
          overflow: 'visible',
        },
        bodyStyle: {
          maxHeight: 756,
          overflow: 'visible',
        },
      })}
    >
      <Box marginTop={-60} alignItems="flex-end">
        <TouchableOpacity onPress={() => history.replace('/')}>
          <Icon name="x" size={60} color="#fff" />
        </TouchableOpacity>
      </Box>
      <QuestionDetails questionId={match.params.questionId} />
    </Dialog>
  );
};

export enum QuestionCategory {
  LATEST = 'LATEST',
  CLOSING_SOON = 'CLOSING_SOON',
  HIGH_REWARD = 'HIGH_REWARD',
  RESOLVED = 'RESOLVED',
}

interface QuestionSortTabProps {
  label: string;
  value: QuestionCategory;
  onPress: (value: QuestionCategory) => void;
  isActive: boolean;
}

const QuestionSortTab = (props: QuestionSortTabProps) => {
  const { label, value, onPress, isActive } = props;
  const theme = useTheme();

  return (
    <TouchableOpacity style={{ flex: 1 }} onPress={() => onPress(value)}>
      <Box paddingBottom={16}>
        <Heading
          align="center"
          size="xxlarge"
          color={isActive ? 'primary' : 'muted'}
        >
          {label}
        </Heading>
      </Box>
      {isActive ? (
        <Divider
          color={theme.colors.text.primary}
          getStyles={() => ({ dividerStyle: { height: 6 } })}
        />
      ) : (
        <Box height={6} />
      )}
      <Divider />
    </TouchableOpacity>
  );
};

interface QuestionSortTabsProps {
  onChangeTab: (value: QuestionCategory) => void;
  currentSort: QuestionCategory;
}

const QuestionSortTabs = (props: QuestionSortTabsProps) => {
  const { onChangeTab, currentSort } = props;

  return (
    <Box flexDirection="row">
      <QuestionSortTab
        label="LATEST"
        isActive={QuestionCategory.LATEST === currentSort}
        value={QuestionCategory.LATEST}
        onPress={onChangeTab}
      />
      <QuestionSortTab
        label="CLOSING SOON"
        isActive={QuestionCategory.CLOSING_SOON === currentSort}
        value={QuestionCategory.CLOSING_SOON}
        onPress={onChangeTab}
      />
      <QuestionSortTab
        label="HIGH REWARD"
        isActive={QuestionCategory.HIGH_REWARD === currentSort}
        value={QuestionCategory.HIGH_REWARD}
        onPress={onChangeTab}
      />
      <QuestionSortTab
        label="RESOLVED"
        isActive={QuestionCategory.RESOLVED === currentSort}
        value={QuestionCategory.RESOLVED}
        onPress={onChangeTab}
      />
    </Box>
  );
};

const sortQuestions = (questions: QuestionBasic[], sort: QuestionCategory) => {
  switch (sort) {
    case QuestionCategory.LATEST:
      return questions.sort((a, b) =>
        compareDesc(a.createdAtDate, b.createdAtDate),
      );
    case QuestionCategory.CLOSING_SOON:
      return questions.sort((a, b) => {
        if (
          a.finalizedAtDate === 'UNANSWERED' ||
          b.finalizedAtDate === 'UNANSWERED'
        ) {
          return -1;
        }

        return compareDesc(a.finalizedAtDate, b.finalizedAtDate);
      });
    case QuestionCategory.HIGH_REWARD:
      return questions.sort((a, b) => b.bounty.sub(a.bounty).toNumber());
    case QuestionCategory.RESOLVED:
      return questions.filter(isFinalized);
    default:
      return questions;
  }
};

export const QuestionList = () => {
  const { questions } = useQuestionsQuery();
  const [sort, setSort] = React.useState(QuestionCategory.LATEST);
  const sortedQuestions = sortQuestions(questions, sort);
  console.log(sortedQuestions, 'sortedQuestions');

  return (
    <Background pattern="dotted">
      <Box paddingVertical={60}>
        <Box paddingBottom={40}>
          <Heading align="center" color="secondary" size="xxxlarge">
            QUESTION LIST
          </Heading>
        </Box>
        <Box paddingBottom={40}>
          <QuestionSortTabs onChangeTab={setSort} currentSort={sort} />
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
      <Route path="/question/:questionId" component={QuestionDetailsDialog} />
    </Background>
  );
};
