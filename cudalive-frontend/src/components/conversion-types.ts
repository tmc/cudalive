export enum UpdateType {
  INITIALIZATION = 'INITIALIZATION',
  ENVIRONMENT_SETUP = 'ENVIRONMENT_SETUP',
  PACKAGE_INSTALLATION = 'PACKAGE_INSTALLATION',
  CONVERSION_PROGRESS = 'CONVERSION_PROGRESS',
  COMPLETION = 'COMPLETION',
  ERROR = 'ERROR'
}

export type UpdateMessage = {
  type: UpdateType;
  message: string;
  isError: boolean;
  isComplete: boolean;
  timestamp: string;
  progress?: number;
  tritonCode?: string;
};