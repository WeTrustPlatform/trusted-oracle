import { formatDistanceToNow } from 'date-fns/esm';
import { Box, Text } from 'paramount-ui';
import React from 'react';
import { useAsync } from 'react-use';
import { Block } from 'web3/eth/types';

import { Link } from '../components/Link';
import { useCurrency } from '../ethereum/CurrencyProvider';
import { formatCurrency } from '../ethereum/CurrencyUtils';
import { useFetchBlock } from '../ethereum/useBlockQuery';
import { useWeb3 } from '../ethereum/Web3Provider';
import { OracleEvent, OracleEventType } from '../oracle/OracleData';
import { useOracle } from '../oracle/OracleProvider';
import { INITIAL_BLOCKS, toDate } from '../oracle/Question';
import { useFetchQuestionQuery } from '../oracle/useQuestionQuery';

const timeAgo = (dateOrBlock: Date | Block) => {
  const date =
    dateOrBlock instanceof Date
      ? dateOrBlock
      : new Date(dateOrBlock.timestamp * 1000);

  return `${formatDistanceToNow(date)} ago`;
};

interface NotificationProps {
  questionId: string;
  questionTitle: string;
  date: string;
  message: string;
}

const Notification = (props: NotificationProps) => {
  const { questionId, questionTitle, date, message } = props;

  return (
    <Link to={`/question/${questionId}`}>
      <Box>
        <Box paddingBottom={16}>
          <Text color="muted">
            {message} {date}
          </Text>
          <Text weight="bold">{questionTitle}</Text>
        </Box>
      </Box>
    </Link>
  );
};

export const useNotificationsQuery = () => {
  const { networkId, account, web3IsLoading } = useWeb3();
  const { realitio, loading: oracleLoading } = useOracle();
  const { currency, isCurrencyLoading } = useCurrency();
  const fetchQuestion = useFetchQuestionQuery();
  const initialBlock = INITIAL_BLOCKS[networkId];
  const fetchBlock = useFetchBlock();

  const { loading, value } = useAsync(async () => {
    const events = (await realitio.getPastEvents('allEvents', {
      fromBlock: initialBlock,
      toBlock: 'latest',
    })) as OracleEvent[];

    const notifications = await Promise.all(
      events.reverse().map(async event => {
        switch (event.event) {
          case OracleEventType.LogNewQuestion:
            if (event.args.user === account) {
              const question = await fetchQuestion(event.args.question_id);

              if (!question) throw new Error('Question not found');

              return (
                <Notification
                  questionId={question.id}
                  date={timeAgo(question.createdAtDate)}
                  questionTitle={question.questionTitle}
                  message="You asked a question"
                />
              );
            }

            return null;
          case OracleEventType.LogNewAnswer:
            const answeredQuestion = await fetchQuestion(
              event.args.question_id,
            );
            if (!answeredQuestion) throw new Error('Question not found');

            if (event.args.user === account) {
              if (event.args.is_commitment) {
                return (
                  <Notification
                    questionId={answeredQuestion.id}
                    date={timeAgo(toDate(event.args.ts))}
                    questionTitle={answeredQuestion.questionTitle}
                    message="You committed to answering a question"
                  />
                );
              } else {
                return (
                  <Notification
                    questionId={answeredQuestion.id}
                    date={timeAgo(toDate(event.args.ts))}
                    questionTitle={answeredQuestion.questionTitle}
                    message="You answered a question"
                  />
                );
              }
            }

            if (answeredQuestion.user === account) {
              return (
                <Notification
                  questionId={answeredQuestion.id}
                  date={timeAgo(toDate(event.args.ts))}
                  questionTitle={answeredQuestion.questionTitle}
                  message="Someone answered your question"
                />
              );
            } else if (
              answeredQuestion.answers
                .slice(1)
                .some(answer => answer.user === account)
            ) {
              return (
                <Notification
                  questionId={answeredQuestion.id}
                  date={timeAgo(toDate(event.args.ts))}
                  questionTitle={answeredQuestion.questionTitle}
                  message="Your answer was overwritten"
                />
              );
            }

            return null;

          case OracleEventType.LogAnswerReveal:
            const answerRevealedQuestion = await fetchQuestion(
              event.args.question_id,
            );
            if (!answerRevealedQuestion) throw new Error('Question not found');
            const answerRevealBlock = await fetchBlock(event.blockNumber);

            if (event.args.user === account) {
              return (
                <Notification
                  questionId={answerRevealedQuestion.id}
                  date={timeAgo(answerRevealBlock)}
                  questionTitle={answerRevealedQuestion.questionTitle}
                  message="You revealed an answer to a question"
                />
              );
            }

            if (answerRevealedQuestion.user === account) {
              return (
                <Notification
                  questionId={answerRevealedQuestion.id}
                  date={timeAgo(answerRevealBlock)}
                  questionTitle={answerRevealedQuestion.questionTitle}
                  message="Someone revealed their answer to your question"
                />
              );
            } else if (
              answerRevealedQuestion.answers
                .slice(1)
                .some(answer => answer.user === account)
            ) {
              return (
                <Notification
                  questionId={answerRevealedQuestion.id}
                  date={timeAgo(answerRevealBlock)}
                  questionTitle={answerRevealedQuestion.questionTitle}
                  message="Your answer was overwritten"
                />
              );
            }

            return null;

          case OracleEventType.LogFundAnswerBounty:
            const rewardBlock = await fetchBlock(event.blockNumber);
            const fundedQuestion = await fetchQuestion(event.args.question_id);
            if (!fundedQuestion) throw new Error('Question not found');
            const reward = formatCurrency(event.args.bounty, currency);

            if (event.args.user === account) {
              return (
                <Notification
                  questionId={fundedQuestion.id}
                  date={timeAgo(rewardBlock)}
                  questionTitle={fundedQuestion.questionTitle}
                  message={`You added ${reward} ${currency} reward`}
                />
              );
            }

            if (fundedQuestion.user === account) {
              return (
                <Notification
                  questionId={fundedQuestion.id}
                  date={timeAgo(rewardBlock)}
                  questionTitle={fundedQuestion.questionTitle}
                  message={`Someone added ${reward} ${currency} reward to your question`}
                />
              );
            } else {
              if (
                fundedQuestion.answers.some(answer => answer.user === account)
              ) {
                return (
                  <Notification
                    questionId={fundedQuestion.id}
                    date={timeAgo(rewardBlock)}
                    questionTitle={fundedQuestion.questionTitle}
                    message={`Someone added ${reward} ${currency} reward to the question you answered`}
                  />
                );
              }
            }

            return null;

          case OracleEventType.LogNotifyOfArbitrationRequest:
            const arbitrationRequestedQuestion = await fetchQuestion(
              event.args.question_id,
            );
            if (!arbitrationRequestedQuestion)
              throw new Error('Question not found');
            const arbitrationRequestBlock = await fetchBlock(event.blockNumber);

            if (event.args.user === account) {
              return (
                <Notification
                  questionId={arbitrationRequestedQuestion.id}
                  date={timeAgo(arbitrationRequestBlock)}
                  questionTitle={arbitrationRequestedQuestion.questionTitle}
                  message="You requested arbitration"
                />
              );
            }

            if (arbitrationRequestedQuestion.user === account) {
              return (
                <Notification
                  questionId={arbitrationRequestedQuestion.id}
                  date={timeAgo(arbitrationRequestBlock)}
                  questionTitle={arbitrationRequestedQuestion.questionTitle}
                  message="Someone requested arbitration to your question"
                />
              );
            }

            if (
              arbitrationRequestedQuestion.answers.some(
                answer => answer.user === account,
              )
            ) {
              return (
                <Notification
                  questionId={arbitrationRequestedQuestion.id}
                  date={timeAgo(arbitrationRequestBlock)}
                  questionTitle={arbitrationRequestedQuestion.questionTitle}
                  message="Someone requested arbitration to the question you answered"
                />
              );
            }

            return null;

          case OracleEventType.LogFinalize:
            const finalizedBlock = await fetchBlock(event.blockNumber);
            const finalizedQuestion = await fetchQuestion(
              event.args.question_id,
            );

            if (!finalizedQuestion) throw new Error('Question not found');

            if (finalizedQuestion.user === account) {
              return (
                <Notification
                  questionId={finalizedQuestion.id}
                  date={timeAgo(finalizedBlock)}
                  questionTitle={finalizedQuestion.questionTitle}
                  message="Your question is finalized"
                />
              );
            } else if (
              finalizedQuestion.answers.some(answer => answer.user === account)
            ) {
              return (
                <Notification
                  questionId={finalizedQuestion.id}
                  date={timeAgo(finalizedBlock)}
                  questionTitle={finalizedQuestion.questionTitle}
                  message="The question you answered is finalized"
                />
              );
            }

            return null;
          case OracleEventType.LogClaim:
            if (event.args.user === account) {
              const claimedBlock = await fetchBlock(event.blockNumber);
              const claimedQuestion = await fetchQuestion(
                event.args.question_id,
              );

              if (!claimedQuestion) throw new Error('Question not found');

              return (
                <Notification
                  questionId={claimedQuestion.id}
                  date={timeAgo(claimedBlock)}
                  questionTitle={claimedQuestion.questionTitle}
                  message={`You claimed ${formatCurrency(
                    event.args.amount,
                    currency,
                  )} ${currency}`}
                />
              );
            }

            return null;

          default:
            return null;
        }
      }),
    );

    return notifications.filter(notif => notif !== null) as JSX.Element[];
  }, [realitio]);

  return {
    loading: loading || isCurrencyLoading || oracleLoading || web3IsLoading,
    data: value || [],
  };
};
