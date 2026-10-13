const MIME_TEXT = 'text/plain';

// Saves a string or Blob to the user's device. Wraps the part that is easy to
// get subtly wrong: the anchor must be in the document for the click to work in
// every browser, and the object URL must be revoked or the Blob leaks for the
// lifetime of the document.
export default class FileDownloadService {

   /**
    * @param {string} filename   suggested name, including the extension
    * @param {string|Blob} content
    * @param {string} [mimeType]
    */
   download(filename, content, mimeType = MIME_TEXT) {
      const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      // Firefox needs the anchor in the tree for the programmatic click.
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      // Revoking synchronously cancels the download in some browsers, so give
      // the navigation a tick to start first.
      setTimeout(() => {
         a.remove();
         URL.revokeObjectURL(url);
      }, 100);
   }

   /** Opens a blob in a new tab (previews, PDFs). Same URL lifetime caveat. */
   open(content, mimeType = MIME_TEXT) {
      const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
   }
}