import BigNumber from 'bn.js';
import { isBefore } from 'date-fns';

export interface NewQuestionEventArgs {
  arbitrator: string;
  content_hash: string;
  created: BigNumber;
  nonce: BigNumber;
  opening_ts: BigNumber;
  question: string;
  question_id: string;
  template_id: BigNumber;
  timeout: BigNumber;
  user: string;
}

export interface NewQuestionEvent {
  args: NewQuestionEventArgs;
  address: string;
  blockHash: string;
  blockNumber: number;
  event: string;
  id: string;
  logIndex: 62;
  raw: any;
  removed: false;
  returnValues: any;
  signature: string;
  transactionHash: string;
  transactionIndex: 38;
}

export interface QuestionFromContract {
  content_hash: string;
  opening_ts: BigNumber;
  timeout: BigNumber;
  finalize_ts: BigNumber;
  is_pending_arbitration: boolean;
  bounty: BigNumber;
  best_answer: string;
  history_hash: string;
  bond: BigNumber;
}

export interface QuestionBase {
  id: string;
  createdAtDate: Date;
  createdAtBlock: number;
  createdBy: string;
  contentHash: string;
  questionTitle: string;
  templateId: number;
  openingDate: Date;
}

export interface Question extends QuestionBase {
  timeout: BigNumber;
  finalizeDate: Date;
  isPendingArbitration: boolean;
  bounty: BigNumber;
  bestAnswer: string;
  historyHash: string;
  bond: BigNumber;
}

export const toDate = (bigNumber: BigNumber) => {
  return new Date(bigNumber.toNumber() * 1000);
};

export const transformNewQuestionEventToQuestion = (
  event: NewQuestionEvent,
): QuestionBase => {
  const { args, blockNumber } = event;

  return {
    id: args.question_id,
    createdAtDate: toDate(args.created),
    createdAtBlock: blockNumber,
    createdBy: args.user,
    contentHash: args.content_hash,
    questionTitle: args.question,
    templateId: args.template_id.toNumber(),
    openingDate: toDate(args.opening_ts),
  };
};

export const enrichQuestionBaseWithQuestionFromContract = (
  question: QuestionBase,
  questionFromContract: QuestionFromContract,
): Question => {
  return {
    ...question,
    timeout: questionFromContract.timeout,
    finalizeDate: toDate(questionFromContract.finalize_ts),
    isPendingArbitration: questionFromContract.is_pending_arbitration,
    bounty: questionFromContract.bounty,
    bestAnswer: questionFromContract.best_answer,
    historyHash: questionFromContract.history_hash,
    bond: questionFromContract.bond,
  };
};

export const isNowBeforeOpeningDate = (question: Question) => {
  var now = new Date();

  return isBefore(now, question.openingDate);
};
