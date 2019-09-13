import BigNumber from 'bn.js';
import React from 'react';
import { useAsync, useAsyncFn } from 'react-use';

import { useWeb3 } from '../ethereum/Web3Provider';
import { Question, QuestionState } from '../oracle/Question';

const useMakeQuestionClaim = () => {
  const { account } = useWeb3();

  const makeQuestionClaim = React.useCallback(
    (question: Question) => {
      let total = new BigNumber(0);

      if (
        question.historyHash ===
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      ) {
        return null;
      }

      if (question.state !== QuestionState.FINALIZED) return null;

      const questionIds = [];
      const answerLengths = [];
      const bonds = [];
      const answers = [];
      const answerers = [];
      const historyHashes = [];

      let isFirst = true;
      let isYours = false;

      for (let i = question.answers.length - 1; i >= 0; i--) {
        // TODO: Check the history hash, and if we haven't reached it, keep going until we do
        // ...since someone may have claimed partway through

        const { answer, bond, user: answerer, historyHash } = question.answers[
          i
        ];
        // TODO: support answer commitments
        // Only set on reveal, otherwise the answer field still holds the commitment ID for commitments
        // if (question_detail['history'][i].args.commitment_id) {
        //   answer = question_detail['history'][i].args.commitment_id;
        // } else {
        //   answer = question_detail['history'][i].args.answer;
        // }

        if (isYours) {
          // Somebody takes over your answer
          if (answerer !== account && question.bestAnswer === answer) {
            isYours = false;
            total = total.sub(bond); // pay them their bond
          } else {
            total = total.add(bond); // take their bond
          }
        } else {
          // You take over someone else's answer
          if (answerer === account && question.bestAnswer === answer) {
            isYours = true;
            total = total.add(bond); // your bond back
          }
        }

        if (isFirst && isYours) {
          total = total.add(question.bounty);
        }

        bonds.push(bond);
        answers.push(answer);
        answerers.push(answerer);
        historyHashes.push(historyHash);

        isFirst = false;
      }

      // Nothing for you to claim, so return nothing
      if (!total.gt(new BigNumber(0))) {
        return null;
      }

      questionIds.push(question.id);
      answerLengths.push(bonds.length);

      // For the history hash, each time we need to provide the previous hash in the history
      // So delete the first item, and add 0x0 to the end.
      historyHashes.shift();
      historyHashes.push('0x0');

      // TODO: Someone may have claimed partway, so we should really be checking against the contract state

      return {
        total,
        questionIds,
        answerLengths,
        answers,
        answerers,
        bonds,
        historyHashes,
      };
    },
    [account],
  );

  return makeQuestionClaim;
};

export interface ClaimArguments {
  questionIds: string[];
  answerLengths: number[];
  answers: string[];
  answerers: string[];
  bonds: BigNumber[];
  historyHashes: string[];
}

const useFetchClaimsQuery = (questions: Question[]) => {
  const makeQuestionClaim = useMakeQuestionClaim();

  const [_, fetch] = useAsyncFn(async () => {
    let claimable = new BigNumber(0);

    const claimArguments: ClaimArguments = {
      questionIds: [],
      answerLengths: [],
      answers: [],
      answerers: [],
      bonds: [],
      historyHashes: [],
    };

    questions.map(makeQuestionClaim).forEach(claim => {
      if (claim) {
        claimable = claimable.add(claim.total);

        claimArguments.questionIds.push(...claim.questionIds);
        claimArguments.answerLengths.push(...claim.answerLengths);
        claimArguments.answers.push(...claim.answers);
        claimArguments.answerers.push(...claim.answerers);
        claimArguments.bonds.push(...claim.bonds);
        claimArguments.historyHashes.push(...claim.historyHashes);
      }
    });

    return {
      claimable,
      claimArguments,
    };
  }, [makeQuestionClaim, questions]);

  return fetch;
};

export const useClaimsQuery = (questions: Question[]) => {
  const fetchClaims = useFetchClaimsQuery(questions);
  const [claims, setClaims] = React.useState<{
    claimArguments: ClaimArguments;
    claimable: BigNumber;
  }>({
    claimArguments: {
      questionIds: [],
      answerLengths: [],
      answers: [],
      answerers: [],
      bonds: [],
      historyHashes: [],
    },
    claimable: new BigNumber(0),
  });

  const { loading } = useAsync(async () => {
    const result = await fetchClaims();

    setClaims(result);
  }, [questions]);

  const refetch = React.useCallback(async () => {
    const result = await fetchClaims();

    setClaims(result);
  }, [questions]);

  return {
    data: claims,
    loading,
    refetch,
  };
};
