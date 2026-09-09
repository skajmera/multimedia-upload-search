import { useState } from 'react';

const TYPES = ['', 'image', 'video', 'audio', 'pdf'];
const SORTS = ['relevance', 'date', 'views'];

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('relevance');

  function handleSubmit(e) {
    e.preventDefault();
    onSearch({ query, type, sort });
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Search by file name or tag..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select value={type} onChange={(e) => setType(e.target.value)}>
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {t || 'All types'}
          </option>
        ))}
      </select>
      <select value={sort} onChange={(e) => setSort(e.target.value)}>
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button type="submit">Search</button>
    </form>
  );
}
