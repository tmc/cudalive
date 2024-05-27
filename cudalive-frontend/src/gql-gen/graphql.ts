/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type CodeSnippet = {
  __typename?: 'CodeSnippet';
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  updatedAt: Scalars['String']['output'];
};

export type CompilationResult = {
  __typename?: 'CompilationResult';
  codeSnippetId: Scalars['ID']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  output: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type CompletionChunk = {
  __typename?: 'CompletionChunk';
  isLast: Scalars['Boolean']['output'];
  text: Scalars['String']['output'];
};

export type Error = {
  __typename?: 'Error';
  columnNumber?: Maybe<Scalars['Int']['output']>;
  lineNumber?: Maybe<Scalars['Int']['output']>;
  message: Scalars['String']['output'];
};

export type Explanation = {
  __typename?: 'Explanation';
  codeSnippetId: Scalars['ID']['output'];
  createdAt: Scalars['String']['output'];
  explanation: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  updatedAt: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createCodeSnippet: CodeSnippet;
  deleteCodeSnippet: Scalars['Boolean']['output'];
  generateExplanation: Explanation;
  updateCodeSnippet: CodeSnippet;
};


export type MutationCreateCodeSnippetArgs = {
  content: Scalars['String']['input'];
};


export type MutationDeleteCodeSnippetArgs = {
  id: Scalars['ID']['input'];
};


export type MutationGenerateExplanationArgs = {
  codeSnippetId: Scalars['ID']['input'];
};


export type MutationUpdateCodeSnippetArgs = {
  content: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};

export type Query = {
  __typename?: 'Query';
  getAllCodeSnippets: Array<CodeSnippet>;
  getCodeSnippet?: Maybe<CodeSnippet>;
  getCompilationResult?: Maybe<CompilationResult>;
  getExplanation?: Maybe<Explanation>;
};


export type QueryGetCodeSnippetArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetCompilationResultArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetExplanationArgs = {
  id: Scalars['ID']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  codeSnippetUpdated: CodeSnippet;
  compilationResultUpdated: CompilationResult;
  errorOccurred: Error;
  explanationGenerated: Explanation;
  genericCompletion?: Maybe<CompletionChunk>;
};


export type SubscriptionCodeSnippetUpdatedArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionCompilationResultUpdatedArgs = {
  codeSnippetId: Scalars['ID']['input'];
};


export type SubscriptionErrorOccurredArgs = {
  codeSnippetId: Scalars['ID']['input'];
};


export type SubscriptionExplanationGeneratedArgs = {
  codeSnippetId: Scalars['ID']['input'];
};


export type SubscriptionGenericCompletionArgs = {
  prompt: Scalars['String']['input'];
};

export type GenericSubscriptionSubscriptionVariables = Exact<{
  prompt: Scalars['String']['input'];
}>;


export type GenericSubscriptionSubscription = { __typename?: 'Subscription', genericCompletion?: { __typename?: 'CompletionChunk', text: string, isLast: boolean } | null };


export const GenericSubscriptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"GenericSubscription"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"prompt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"genericCompletion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"prompt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"prompt"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"isLast"}}]}}]}}]} as unknown as DocumentNode<GenericSubscriptionSubscription, GenericSubscriptionSubscriptionVariables>;