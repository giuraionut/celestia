export type Cursor = {
    nextCursor?: string;
}

export type PostSuggestion = {
  id: string;
  title: string;
  snippet: string;
  communityName: string;
};