export type LiffProfile = {
  displayName: string;
  userId: string;
  pictureUrl?: string;
};

export type LiffShareMessage = {
  type: "text";
  text: string;
};

export type LiffClient = {
  init(options: { liffId: string }): Promise<void>;
  isInClient(): boolean;
  isLoggedIn(): boolean;
  getProfile(): Promise<LiffProfile>;
  shareTargetPicker(messages: LiffShareMessage[]): Promise<unknown>;
};

declare global {
  interface Window {
    liff?: LiffClient;
  }
}
