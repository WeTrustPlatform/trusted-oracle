import {
  Box,
  Column,
  Container,
  Dialog,
  Divider,
  Icon,
  Row,
  Text,
  useLayout,
  useTheme,
} from 'paramount-ui';
import React from 'react';
import { ImageBackground, TouchableOpacity } from 'react-native';
import { Route, RouteChildrenProps } from 'react-router';

import { Question } from '../oracle/Question';
import { useQuestionsQuery } from '../oracle/useQuestionsQuery';
import { Link } from './Link';
import {
  QuestionDetails,
  QuestionPostedDate,
  QuestionReward,
  QuestionTooltip,
} from './QuestionDetails';

interface QuestionCardProps {
  question: Question;
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

export const QuestionList = () => {
  const { questions } = useQuestionsQuery();

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
                  <Link to={`/question/${question.id}`}>
                    <QuestionCard question={question} />
                  </Link>
                </Box>
              </Column>
            ))}
          </Row>
          {/* {loading && (
            <Row>
              <Column>
                <Text>Loading...</Text>
              </Column>
            </Row>
          )} */}
        </Container>
      </Box>
      <Route path="/question/:questionId" component={QuestionDetailsDialog} />
    </ImageBackground>
  );
};
