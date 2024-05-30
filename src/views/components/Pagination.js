import React from 'react';
import Pagination from 'react-bootstrap/Pagination';

function PaginationComponent({ count, page, handlePagination }) {
  const pages = Math.ceil(count / 10);
  
  let items = [];
  for (let number = 1; number <= pages; number++) {
    items.push(
      <Pagination.Item
        key={number}
        active={number === page}
        onClick={() => handlePagination(number)}
      >
        {number}
      </Pagination.Item>,
    );
  }

  return <Pagination> <Pagination.First onClick={() => handlePagination(page - 1)}></Pagination.First>{items}<Pagination.Last onClick={() => handlePagination(page + 1)}></Pagination.Last></Pagination>;
}

export default PaginationComponent;