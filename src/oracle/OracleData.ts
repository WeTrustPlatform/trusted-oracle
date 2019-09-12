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

export interface NewQuestionEvent {
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

export interface NewAnswerEvent {
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

export interface NewAnswerEvent {
  args: NewAnswerEventArgs;
  event: OracleEventType.LogNewAnswer;
}

export interface SetQuestionFeeEventArgs {
  arbitrator: string;
  amount: BigNumber;
}

export interface SetQuestionFeeEvent {
  args: SetQuestionFeeEventArgs;
  event: OracleEventType.LogSetQuestionFee;
}

export interface NewTemplateEventArgs {
  template_id: BigNumber;
  user: string;
  question_text: string;
}

export interface NewTemplateEvent {
  args: NewTemplateEventArgs;
  event: OracleEventType.LogNewTemplate;
}

export interface FundAnswerBountyEventArgs {
  question_id: string;
  bounty_added: BigNumber;
  bounty: BigNumber;
  user: string;
}

export interface FundAnswerBountyEvent {
  args: FundAnswerBountyEventArgs;
  event: OracleEventType.LogFundAnswerBounty;
}

export interface AnswerRevealEventArgs {
  question_id: string;
  user: string;
  answer_hash: string;
  answer: string;
  nonce: BigNumber;
  bon: BigNumber;
}

export interface AnswerRevealEvent {
  args: AnswerRevealEventArgs;
  event: OracleEventType.LogAnswerReveal;
}

export interface NotifyOfArbitrationRequestEventArgs {
  question_id: string;
  user: string;
}

export interface NotifyOfArbitrationRequestEvent {
  args: NotifyOfArbitrationRequestEventArgs;
  event: OracleEventType.LogNotifyOfArbitrationRequest;
}

export interface FinalizeEventArgs {
  question_id: string;
  answer: string;
}

export interface FinalizeEvent {
  args: FinalizeEventArgs;
  event: OracleEventType.LogFinalize;
}

export interface ClaimEventArgs {
  question_id: string;
  user: string;
  amount: BigNumber;
}

export interface ClaimEvent {
  args: ClaimEventArgs;
  event: OracleEventType.LogClaim;
}
