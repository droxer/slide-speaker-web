// Keep emoji icons for backward compatibility
export const getFileTypeIcon = (fileExt: string): string => {
  if (!fileExt) return '📄';

  const ext = fileExt.toLowerCase().replace(/^\./, '');

  const iconMap: Record<string, string> = {
    pdf: '📑',
    ppt: '📊',
    pptx: '📊',
    doc: '📝',
    docx: '📝',
    xls: '📈',
    xlsx: '📈',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    mp4: '🎬',
    avi: '🎬',
    mov: '🎬',
    wmv: '🎬',
    mp3: '🎵',
    wav: '🎵',
    aac: '🎵',
    flac: '🎵',
  };

  return iconMap[ext] || '📄';
};

// New function to get image source paths for PNG icons
export const getFileTypeIconPath = (fileExt: string): string | null => {
  if (!fileExt) return null;

  const ext = fileExt.toLowerCase().replace(/^\./, '');

  const iconPathMap: Record<string, string> = {
    pdf: '/pdf.png',
    ppt: '/ppt.png',
    pptx: '/ppt.png',
  };

  return iconPathMap[ext] || null;
};

// Helper function to check if a PNG icon exists for the file type
export const hasPngIcon = (fileExt: string): boolean => {
  return getFileTypeIconPath(fileExt) !== null;
};

// Function to get the appropriate icon (PNG path or emoji)
export const getFileIconSource = (
  fileExt: string
): { type: 'png' | 'emoji'; value: string } => {
  const pngPath = getFileTypeIconPath(fileExt);
  if (pngPath) {
    return { type: 'png', value: pngPath };
  }
  return { type: 'emoji', value: getFileTypeIcon(fileExt) };
};

export const isPdf = (fileExt?: string): boolean => {
  if (!fileExt) return false;
  const ext = fileExt.toLowerCase().replace(/^\./, '');
  return ext === 'pdf';
};

export const isPowerPoint = (fileExt?: string): boolean => {
  if (!fileExt) return false;
  const ext = fileExt.toLowerCase().replace(/^\./, '');
  return ext === 'ppt' || ext === 'pptx';
};

export const getFileTypeCategory = (fileExt?: string): string => {
  if (!fileExt) return 'generic';

  const ext = fileExt.toLowerCase().replace(/^\./, '');

  if (ext === 'pdf') return 'pdf';
  if (ext === 'ppt' || ext === 'pptx') return 'ppt';
  if (ext === 'doc' || ext === 'docx') return 'doc';
  if (ext === 'xls' || ext === 'xlsx') return 'xls';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'aac', 'flac'].includes(ext)) return 'audio';

  return 'generic';
};
