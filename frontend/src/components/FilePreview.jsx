export default function FilePreview({ file }) {
  switch (file.fileType) {
    case 'image':
      return <img className="file-preview file-preview--image" src={file.url} alt={file.fileName} loading="lazy" />;
    case 'video':
      return (
        <video className="file-preview file-preview--video" src={file.url} controls preload="metadata" />
      );
    case 'audio':
      return <audio className="file-preview file-preview--audio" src={file.url} controls />;
    case 'pdf':
      return (
        <a className="file-preview file-preview--pdf" href={file.url} target="_blank" rel="noreferrer">
          📄 Open PDF
        </a>
      );
    default:
      return null;
  }
}
