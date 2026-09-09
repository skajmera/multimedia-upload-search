import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { uploadFile, searchFiles, resetUploadStatus } from '../redux/slices/fileSlice';
import SearchBar from '../components/SearchBar';
import FileCard from '../components/FileCard';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { results, total, status, error, uploadStatus, uploadError } = useSelector(
    (state) => state.files
  );

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    dispatch(searchFiles({ sort: 'relevance' }));
  }, [dispatch]);

  useEffect(() => {
    if (uploadStatus === 'succeeded') {
      setFile(null);
      setFileName('');
      setTags('');
      dispatch(resetUploadStatus());
    }
  }, [uploadStatus, dispatch]);

  function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    dispatch(uploadFile({ file, fileName, tags }));
  }

  function handleSearch(params) {
    dispatch(searchFiles(params));
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>Multimedia Library</h1>
        <div>
          <span>{user?.name}</span>
          <button onClick={() => dispatch(logout())}>Log out</button>
        </div>
      </header>

      <section className="upload-panel">
        <h2>Upload a file</h2>
        <form onSubmit={handleUpload}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
          <input
            type="text"
            placeholder="Display name (optional)"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Tags, comma-separated"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <button type="submit" disabled={uploadStatus === 'loading'}>
            {uploadStatus === 'loading' ? 'Uploading...' : 'Upload'}
          </button>
        </form>
        {uploadError && <p className="error">{uploadError}</p>}
      </section>

      <section className="search-panel">
        <SearchBar onSearch={handleSearch} />
        {status === 'loading' && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        <p className="result-count">{total} result(s)</p>
        <div className="file-grid">
          {results.map((f) => (
            <FileCard key={f._id} file={f} />
          ))}
        </div>
      </section>
    </div>
  );
}
