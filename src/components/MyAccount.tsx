import { uniqBy } from 'lodash';
import { Box, Column, Container, Heading, Row, Text } from 'paramount-ui';
import React from 'react';
import { useAsync } from 'react-use';

import { useWeb3 } from '../ethereum/Web3Provider';
import {
  NewAnswerEvent,
  NewQuestionEvent,
  OracleEventType,
} from '../oracle/OracleData';
import { useOracle } from '../oracle/OracleProvider';
import { INITIAL_BLOCKS, Question } from '../oracle/Question';
import { QuestionCard } from '../oracle/QuestionList';
import { useFetchQuestionQuery } from '../oracle/useQuestionQuery';
import { Background } from './Background';
import { Tabs } from './CustomTabs';

enum MyAccountTab {
  QUESTION = 'QUESTION',
  ANSWER = 'ANSWER',
}

interface TabProps {
  isActive: boolean;
}

const AnswerTab = (props: TabProps) => {
  const { isActive } = props;
  const { networkId, account } = useWeb3();
  const { realitio } = useOracle();
  const fetchQuestion = useFetchQuestionQuery();
  const initialBlock = INITIAL_BLOCKS[networkId];

  const { loading, value: questions } = useAsync(async () => {
    const events = (await realitio.getPastEvents(OracleEventType.LogNewAnswer, {
      fromBlock: initialBlock,
      toBlock: 'latest',
      filter: { user: account },
    })) as NewAnswerEvent[];

    const uniqueEvents = uniqBy(events, event => event.args.question_id);

    const questions = await Promise.all(
      uniqueEvents.map(async event => fetchQuestion(event.args.question_id)),
    );

    return questions.filter(Boolean) as Question[];
  }, [realitio]);

  if (!isActive) return null;
  if (loading) return <Text>Loading...</Text>;
  if (!questions) return <Text>Could not load questions</Text>;

  return (
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
    </Container>
  );
};

const QuestionTab = (props: TabProps) => {
  const { isActive } = props;
  const { networkId, account } = useWeb3();
  const { realitio } = useOracle();
  const fetchQuestion = useFetchQuestionQuery();
  const initialBlock = INITIAL_BLOCKS[networkId];

  const { loading, value: questions } = useAsync(async () => {
    const events = (await realitio.getPastEvents(
      OracleEventType.LogNewQuestion,
      {
        fromBlock: initialBlock,
        toBlock: 'latest',
        filter: { user: account },
      },
    )) as NewQuestionEvent[];

    const questions = await Promise.all(
      events.map(async event => fetchQuestion(event.args.question_id)),
    );

    return questions.filter(Boolean) as Question[];
  }, [realitio]);

  if (!isActive) return null;
  if (loading) return <Text>Loading...</Text>;
  if (!questions) return <Text>Could not load questions</Text>;

  return (
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
    </Container>
  );
};

export const MyAccount = () => {
  const [tab, setTab] = React.useState(MyAccountTab.QUESTION);

  return (
    <Box>
      <Box paddingBottom={16} paddingHorizontal={60} paddingTop={40}>
        <Heading align="center" color="primary" size="xxlarge">
          MY ACCOUNT
        </Heading>
      </Box>
      <Background pattern="dotted">
        <Box paddingHorizontal={60}>
          <Box paddingBottom={40}>
            <Tabs
              // eslint-disable-next-line
              // @ts-ignore: we know that only MyAccountTab is passed in
              onChangeTab={setTab}
              currentValue={tab}
              tabs={[
                {
                  label: 'QUESTION',
                  value: MyAccountTab.QUESTION,
                },
                {
                  label: 'ANSWER',
                  value: MyAccountTab.ANSWER,
                },
              ]}
            />
          </Box>
          <QuestionTab isActive={tab === MyAccountTab.QUESTION} />
          <AnswerTab isActive={tab === MyAccountTab.ANSWER} />
        </Box>
      </Background>
    </Box>
  );
};
