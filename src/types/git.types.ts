export interface GitCommit {
  oid: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      timestamp: number;
    };
    parent?: string | string[];
  };
}

export interface Branch {
  name: string;
  current?: boolean;
}

export interface DiffResponse {
  diff: string;
  files: string[];
}

