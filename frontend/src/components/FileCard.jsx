import FilePreview from './FilePreview';

export default function FileCard({ file }) {
  return (
    <div className="file-card">
      <FilePreview file={file} />
      <div className="file-card__meta">
        <h3 title={file.fileName}>{file.fileName}</h3>
        <div className="file-card__tags">
          {(file.tags || []).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <div className="file-card__stats">
          <span>{file.viewCount} views</span>
          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
