import { OnSetPage } from '@patternfly/react-core';
import { useCallback, useState } from 'react';

type TablePaginationLocalStorage = {
  key: string;
};

export type PaginationLocalStorage = {
  perPage: number;
  page: number;
  onSetPage: OnSetPage;
  onPerPageSelect: (
    e: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    perPage: number,
    newPage: number,
  ) => void;
  setPage: (page: number) => void;
};

export const useTablePaginationLocalStorage = ({ key }: TablePaginationLocalStorage) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(Number(localStorage.getItem(key)) || 20);

  const onPerPageSelect = useCallback(
    (_, newPerPage, newPage) => {
      // Save this value through page refresh for use on next reload
      setPerPage(newPerPage);
      setPage(newPage);
      localStorage.setItem(key, newPerPage.toString());
    },
    [key],
  );

  const onSetPage = useCallback((_, newPage) => setPage(newPage), []);

  return { page, perPage, onPerPageSelect, onSetPage, setPage };
};
