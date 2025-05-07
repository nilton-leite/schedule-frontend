import React from 'react';
import Pagination from 'react-bootstrap/Pagination';

function PaginationComponent({ count, page, handlePagination }) {
  const pages = Math.ceil(count / 10);
  const maxPagesToShow = 5;

  let items = [];

  // Sempre mostra o primeiro item
  items.push(
    <Pagination.Item
      key={1}
      active={page === 1}
      onClick={() => handlePagination(1)}
    >
      1
    </Pagination.Item>
  );

  // Adiciona "..." se necessário
  if (page > Math.floor(maxPagesToShow / 2) + 2) {
    items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
  }

  // Define intervalo de páginas do meio
  let startPage = Math.max(2, page - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(pages - 1, page + Math.floor(maxPagesToShow / 2));

  // Ajusta se estiver no começo
  if (page <= Math.floor(maxPagesToShow / 2)) {
    endPage = Math.min(pages - 1, maxPagesToShow);
  }

  // Ajusta se estiver no final
  if (page >= pages - Math.floor(maxPagesToShow / 2)) {
    startPage = Math.max(2, pages - maxPagesToShow + 1);
  }

  // Cria as páginas do meio
  for (let number = startPage; number <= endPage; number++) {
    items.push(
      <Pagination.Item
        key={number}
        active={number === page}
        onClick={() => handlePagination(number)}
      >
        {number}
      </Pagination.Item>
    );
  }

  // Adiciona "..." se necessário
  if (page < pages - Math.floor(maxPagesToShow / 2) - 1) {
    items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
  }

  // Sempre mostra o último item
  if (pages > 1) {
    items.push(
      <Pagination.Item
        key={pages}
        active={page === pages}
        onClick={() => handlePagination(pages)}
      >
        {pages}
      </Pagination.Item>
    );
  }

  return (
    <Pagination>
      <Pagination.Prev
        onClick={() => handlePagination(page > 1 ? page - 1 : 1)}
        disabled={page === 1}
      />
      {items}
      <Pagination.Next
        onClick={() => handlePagination(page < pages ? page + 1 : pages)}
        disabled={page === pages}
      />
    </Pagination>
  );
}

export default PaginationComponent;
