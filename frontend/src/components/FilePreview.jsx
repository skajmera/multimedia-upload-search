// Registers a "view" at the moment the user actually engages with the file,
// not just when the card renders in a list: a click-through for images/PDFs,
// or the first play for video/audio (native <video>/<audio> controls already
// handle playback, so we only need to hook their onPlay).
export default function FilePreview({ file, onView }) {
  switch (file.fileType) {
    case 'image':
      return (
        <img
          className="file-preview file-preview--image"
          src={file.url}
          alt={file.fileName}
          loading="lazy"
          onClick={() => {
            onView();
            window.open(file.url, '_blank', 'noopener,noreferrer');
          }}
        />
      );
    case 'video':
      return (
        <video
          className="file-preview file-preview--video"
          src={file.url}
          controls
          preload="metadata"
          onPlay={onView}
        />
      );
    case 'audio':
      return (
        <audio className="file-preview file-preview--audio" src={file.url} controls onPlay={onView} />
      );
    case 'pdf':
      return (
        <a
          className="file-preview file-preview--pdf"
          href={file.url}
          target="_blank"
          rel="noreferrer"
          onClick={onView}
        >
          📄 Open PDF
        </a>
      );
    default:
      return null;
  }
}
