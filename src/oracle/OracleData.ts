import TEMPLATE_CONFIG from '@realitio/realitio-contracts/config/templates.json';
import BigNumber from 'bn.js';

export interface QuestionTemplates {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
}

export const getTemplates = (): QuestionTemplates => {
  return TEMPLATE_CONFIG.content;
};

export enum OracleEventType {
  'LogSetQuestionFee' = 'LogSetQuestionFee',
  'LogNewTemplate' = 'LogNewTemplate',
  'LogNewQuestion' = 'LogNewQuestion',
  'LogFundAnswerBounty' = 'LogFundAnswerBounty',
  'LogNewAnswer' = 'LogNewAnswer',
  'LogAnswerReveal' = 'LogAnswerReveal',
  'LogNotifyOfArbitrationRequest' = 'LogNotifyOfArbitrationRequest',
  'LogFinalize' = 'LogFinalize',
  'LogClaim' = 'LogClaim',
}

export interface EventBase {
  address: string;
  blockHash: string;
  blockNumber: number;
  event: OracleEventType;
  id: string;
  logIndex: number;
  removed: boolean;
  signature: string;
  transactionHash: string;
  transactionIndex: number;
}

export type OracleEvent =
  | NewQuestionEvent
  | NewAnswerEvent
  | NewAnswerEvent
  | SetQuestionFeeEvent
  | NewTemplateEvent
  | FundAnswerBountyEvent
  | AnswerRevealEvent
  | NotifyOfArbitrationRequestEvent
  | FinalizeEvent
  | ClaimEvent;

export interface QuestionJson {
  title: string;
  type: string;
  category: string;
  lang: string;
}

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

export interface NewQuestionEvent extends EventBase {
  args: NewQuestionEventArgs;
  event: OracleEventType.LogNewQuestion;
}

export interface NewAnswerEventArgs {
  answer: string;
  bond: BigNumber;
  history_hash: string;
  is_commitment: boolean;
  question_id: string;
  ts: BigNumber;
  user: string;
}

export interface NewAnswerEvent extends EventBase {
  args: NewAnswerEventArgs;
  event: OracleEventType.LogNewAnswer;
}

export interface NewAnswerEventArgs {
  answer: string;
  bond: BigNumber;
  history_hash: string;
  is_commitment: boolean;
  question_id: string;
  ts: BigNumber;
  user: string;
}

export interface NewAnswerEvent extends EventBase {
  args: NewAnswerEventArgs;
  event: OracleEventType.LogNewAnswer;
}

export interface SetQuestionFeeEventArgs {
  arbitrator: string;
  amount: BigNumber;
}

export interface SetQuestionFeeEvent extends EventBase {
  args: SetQuestionFeeEventArgs;
  event: OracleEventType.LogSetQuestionFee;
}

export interface NewTemplateEventArgs {
  template_id: BigNumber;
  user: string;
  question_text: string;
}

export interface NewTemplateEvent extends EventBase {
  args: NewTemplateEventArgs;
  event: OracleEventType.LogNewTemplate;
}

export interface FundAnswerBountyEventArgs {
  question_id: string;
  bounty_added: BigNumber;
  bounty: BigNumber;
  user: string;
}

export interface FundAnswerBountyEvent extends EventBase {
  args: FundAnswerBountyEventArgs;
  event: OracleEventType.LogFundAnswerBounty;
}

export interface AnswerRevealEventArgs {
  question_id: string;
  user: string;
  answer_hash: string;
  answer: string;
  nonce: BigNumber;
  bond: BigNumber;
}

export interface AnswerRevealEvent extends EventBase {
  args: AnswerRevealEventArgs;
  event: OracleEventType.LogAnswerReveal;
}

export interface NotifyOfArbitrationRequestEventArgs {
  question_id: string;
  user: string;
}

export interface NotifyOfArbitrationRequestEvent extends EventBase {
  args: NotifyOfArbitrationRequestEventArgs;
  event: OracleEventType.LogNotifyOfArbitrationRequest;
}

export interface FinalizeEventArgs {
  question_id: string;
  answer: string;
}

export interface FinalizeEvent extends EventBase {
  args: FinalizeEventArgs;
  event: OracleEventType.LogFinalize;
}

export interface ClaimEventArgs {
  question_id: string;
  user: string;
  amount: BigNumber;
}

export interface ClaimEvent extends EventBase {
  args: ClaimEventArgs;
  event: OracleEventType.LogClaim;
}
