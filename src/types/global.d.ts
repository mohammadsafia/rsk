import 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    apiVersion?: number;
  }
}

declare module 'material-react-table' {
  interface MRT_ColumnDef {
    enableRowSelection?: boolean;
  }
}
