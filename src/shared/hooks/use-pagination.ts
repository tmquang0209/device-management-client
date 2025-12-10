import { useState } from "react";

export function usePagination(initialPage = 1, pageSize = 10) {
  const [page, setPage] = useState(initialPage);

  function nextPage() {
    setPage((p) => p + 1);
  }

  function prevPage() {
    setPage((p) => Math.max(1, p - 1));
  }

  return { page, pageSize, nextPage, prevPage, setPage };
}
