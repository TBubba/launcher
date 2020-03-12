export type InitArgs = Partial<{
  'connect-remote': string;
  'host-remote': boolean;
  'back-only': boolean;
  'flash': boolean;
}>;

export type Init = {
  args: InitArgs;
  rest: string;
}
