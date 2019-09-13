export interface AsyncResult<TData = any> {
  loading: boolean;
  data: TData;
}
