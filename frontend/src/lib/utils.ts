export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function getFileTypeIcon(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'mp3':
    case 'wav':
    case 'aac':
    case 'ogg':
      return '🎵';
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
      return '🎬';
    case 'txt':
    case 'doc':
    case 'docx':
    case 'pdf':
      return '📄';
    default:
      return '📁';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'uploading':
      return 'bg-blue-100 text-blue-800';
    case 'processing':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}