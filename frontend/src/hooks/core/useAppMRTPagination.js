import { useCallback, useEffect, useState } from "react";

function useAppMRTPagination() {
  const [totalRecords, setTotalRecords] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  const buildPayload = useCallback(() => {
    const payload = {
      page: pagination.pageIndex,
      size: pagination.pageSize,
    };

    if (debouncedSearch?.trim()) {
      payload.searchTerm = debouncedSearch;
    }

    payload.sorting =
      sorting.length > 0
        ? sorting.map((s) => ({
            fieldName: s.id,
            order: s.desc ? "desc" : "asc",
          }))
        : [];

    payload.filters =
      columnFilters.length > 0
        ? columnFilters.map((f) => ({
            fieldName: f.id,
            operator: f.operator || "EQUAL",
            value: f.value,
          }))
        : [];

    return payload;
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    debouncedSearch,
  ]);

  return {
    buildPayload,
    setPagination,
    setSorting,
    setColumnFilters,
    setSearchText,
    setTotalRecords,
    searchText,
    totalRecords,
    sorting,
    columnFilters,
    pagination,
  };
}

export default useAppMRTPagination;
