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
  compilationResult?: Maybe<CompilationResult>;
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  language: Language;
  updatedAt: Scalars['String']['output'];
};

export type CompilationResult = {
  __typename?: 'CompilationResult';
  codeSnippetId: Scalars['ID']['output'];
  createdAt: Scalars['String']['output'];
  errorMessage?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  output: Scalars['String']['output'];
  status: CompilationStatus;
};

export enum CompilationStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING'
}

export type CompletionChunk = {
  __typename?: 'CompletionChunk';
  isLast: Scalars['Boolean']['output'];
  text: Scalars['String']['output'];
};

export type ConversionHistory = {
  __typename?: 'ConversionHistory';
  id: Scalars['ID']['output'];
  pythonCode: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  tritonCode: Scalars['String']['output'];
};

export enum Language {
  Python = 'PYTHON',
  Triton = 'TRITON'
}

export type Mutation = {
  __typename?: 'Mutation';
  compileCodeSnippet: CompilationResult;
  createCodeSnippet: CodeSnippet;
  deleteCodeSnippet: Scalars['Boolean']['output'];
  saveConversion: ConversionHistory;
  updateCodeSnippet: CodeSnippet;
};


export type MutationCompileCodeSnippetArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCreateCodeSnippetArgs = {
  content: Scalars['String']['input'];
  language: Language;
};


export type MutationDeleteCodeSnippetArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSaveConversionArgs = {
  pythonCode: Scalars['String']['input'];
  tritonCode: Scalars['String']['input'];
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
  getConversionHistory: Array<ConversionHistory>;
};


export type QueryGetCodeSnippetArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetCompilationResultArgs = {
  id: Scalars['ID']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  codeSnippetUpdated: CodeSnippet;
  compilationResultUpdated: CompilationResult;
  convertPythonToTriton: UpdateMessage;
  genericCompletion?: Maybe<CompletionChunk>;
};


export type SubscriptionCodeSnippetUpdatedArgs = {
  id: Scalars['ID']['input'];
};


export type SubscriptionCompilationResultUpdatedArgs = {
  codeSnippetId: Scalars['ID']['input'];
};


export type SubscriptionConvertPythonToTritonArgs = {
  pythonCode: Scalars['String']['input'];
};


export type SubscriptionGenericCompletionArgs = {
  prompt: Scalars['String']['input'];
};

export type UpdateMessage = {
  __typename?: 'UpdateMessage';
  isComplete: Scalars['Boolean']['output'];
  isError: Scalars['Boolean']['output'];
  message: Scalars['String']['output'];
  progress?: Maybe<Scalars['Float']['output']>;
  timestamp: Scalars['String']['output'];
  tritonCode?: Maybe<Scalars['String']['output']>;
  type: UpdateType;
};

export enum UpdateType {
  Completion = 'COMPLETION',
  ConversionProgress = 'CONVERSION_PROGRESS',
  EnvironmentSetup = 'ENVIRONMENT_SETUP',
  Error = 'ERROR',
  Initialization = 'INITIALIZATION',
  PackageInstallation = 'PACKAGE_INSTALLATION'
}

export type GenericSubscriptionSubscriptionVariables = Exact<{
  prompt: Scalars['String']['input'];
}>;


export type GenericSubscriptionSubscription = { __typename?: 'Subscription', genericCompletion?: { __typename?: 'CompletionChunk', text: string, isLast: boolean } | null };

export type ConvertPythonToTritonSubscriptionVariables = Exact<{
  pythonCode: Scalars['String']['input'];
}>;


export type ConvertPythonToTritonSubscription = { __typename?: 'Subscription', convertPythonToTriton: { __typename?: 'UpdateMessage', type: UpdateType, message: string, isError: boolean, isComplete: boolean, timestamp: string, progress?: number | null, tritonCode?: string | null } };

export type SaveConversionMutationVariables = Exact<{
  pythonCode: Scalars['String']['input'];
  tritonCode: Scalars['String']['input'];
}>;


export type SaveConversionMutation = { __typename?: 'Mutation', saveConversion: { __typename?: 'ConversionHistory', id: string, pythonCode: string, tritonCode: string, timestamp: string } };


export const GenericSubscriptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"GenericSubscription"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"prompt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"genericCompletion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"prompt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"prompt"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"isLast"}}]}}]}}]} as unknown as DocumentNode<GenericSubscriptionSubscription, GenericSubscriptionSubscriptionVariables>;
export const ConvertPythonToTritonDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ConvertPythonToTriton"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pythonCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"convertPythonToTriton"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pythonCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pythonCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"isError"}},{"kind":"Field","name":{"kind":"Name","value":"isComplete"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"progress"}},{"kind":"Field","name":{"kind":"Name","value":"tritonCode"}}]}}]}}]} as unknown as DocumentNode<ConvertPythonToTritonSubscription, ConvertPythonToTritonSubscriptionVariables>;
export const SaveConversionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveConversion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pythonCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tritonCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveConversion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pythonCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pythonCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"tritonCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tritonCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pythonCode"}},{"kind":"Field","name":{"kind":"Name","value":"tritonCode"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]}}]} as unknown as DocumentNode<SaveConversionMutation, SaveConversionMutationVariables>;