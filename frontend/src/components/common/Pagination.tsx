import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui';

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ currentPage, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Show at most 5 page numbers, centered around the current page
  let visiblePages = pages;
  if (totalPages > 5) {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    visiblePages = pages.slice(start - 1, end);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {visiblePages[0] > 1 && (
        <>
          <Button variant="outline" size="sm" onClick={() => onChange(1)}>
            1
          </Button>
          {visiblePages[0] > 2 && <span className="text-gray-500">...</span>}
        </>
      )}

      {visiblePages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(page)}
        >
          {page}
        </Button>
      ))}

      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="text-gray-500">...</span>
          )}
          <Button variant="outline" size="sm" onClick={() => onChange(totalPages)}>
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
