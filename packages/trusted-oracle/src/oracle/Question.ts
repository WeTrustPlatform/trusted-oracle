import BigNumber from 'bn.js';
import { isAfter, isBefore } from 'date-fns';

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
  logIndex: number;
  raw: any;
  removed: false;
  returnValues: any;
  signature: string;
  transactionHash: string;
  transactionIndex: number;
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

export interface QuestionFromNewQuestionEvent {
  id: string;
  createdAtDate: Date;
  createdAtBlock: number;
  createdBy: string;
  contentHash: string;
  questionTitle: string;
  templateId: number;
  openingDate: Date;
}

type Unanswered = 'UNANSWERED';

/**
 * Question with basic information for display in a list of question
 */
export interface QuestionBasic extends QuestionFromNewQuestionEvent {
  timeout: BigNumber;
  finalizedAtDate: Date | Unanswered;
  isPendingArbitration: boolean;
  bounty: BigNumber;
  bestAnswer: string;
  historyHash: string;
  bond: BigNumber;
}

/**
 * Question with all the necessary information to display in QuestionDetails
 */
export interface Question extends QuestionBasic {
  state: QuestionState;
}

export enum QuestionState {
  NOT_OPEN = 'NOT_OPEN',
  OPEN = 'OPEN',
  FINALIZED = 'FINALIZED',
}

export enum QuestionType {
  //  A simple yes or no answer. Note that this has no value for “null” or “undecided”. If you want to be able to report these options, you may prefer a multi-choice question.
  BINARY = 'BINARY',
  // A positive (unsigned) number. By default questions allow up to 13 decimals.
  NUMBER = 'NUMBER',
  // One answer can be selected from a list. The answer form will display this as a select box.
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  // Multiple answers can be selected from a list. The answer form will display this as a group of checkboxes.
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  // A date or date and time. The answer form will display this as a date picker.
  DATE_TIME = 'DATE_TIME',
}

export const toDate = (bigNumber: BigNumber) => {
  return new Date(bigNumber.toNumber() * 1000);
};

export const transformNewQuestionEventToQuestion = (
  event: NewQuestionEvent,
): QuestionFromNewQuestionEvent => {
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

export const isOpen = (question: QuestionBasic) => {
  const now = new Date();

  const isPastOpeningDate = isAfter(now, question.openingDate);
  const isBeforeFinalizedDate =
    question.finalizedAtDate === 'UNANSWERED' ||
    isBefore(now, question.finalizedAtDate);

  return (
    isPastOpeningDate && isBeforeFinalizedDate && !question.isPendingArbitration
  );
};

const isAnswered = (question: QuestionFromContract) => {
  const finalizedAtDate = question.finalize_ts.toNumber();
  return finalizedAtDate > 1;
};

export const isFinalized = (question: QuestionBasic) => {
  if (question.isPendingArbitration) return false;
  if (question.finalizedAtDate === 'UNANSWERED') return false;

  return isAfter(new Date(), question.finalizedAtDate);
};

const getQuestionState = (question: QuestionBasic): QuestionState => {
  if (isFinalized(question)) return QuestionState.FINALIZED;
  if (isOpen(question)) return QuestionState.OPEN;

  return QuestionState.NOT_OPEN;
};

export const toQuestionBasic = (
  questionFromNewQuestionEvent: QuestionFromNewQuestionEvent,
  questionFromContract: QuestionFromContract,
): QuestionBasic => {
  return {
    ...questionFromNewQuestionEvent,
    timeout: questionFromContract.timeout,
    finalizedAtDate: isAnswered(questionFromContract)
      ? toDate(questionFromContract.finalize_ts)
      : 'UNANSWERED',
    isPendingArbitration: questionFromContract.is_pending_arbitration,
    bounty: questionFromContract.bounty,
    bestAnswer: questionFromContract.best_answer,
    historyHash: questionFromContract.history_hash,
    bond: questionFromContract.bond,
  };
};

export const toQuestion = (question: QuestionBasic): Question => {
  return {
    ...question,
    state: getQuestionState(question),
  };
};
