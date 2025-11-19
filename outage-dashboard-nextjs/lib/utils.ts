import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function getHeatmapColor(intensity: number): string {
  // Intensity from 0 to 1
  const colors = [
    { threshold: 0.0, color: '#00ff00' }, // Green
    { threshold: 0.2, color: '#88ff00' },
    { threshold: 0.4, color: '#ffff00' }, // Yellow
    { threshold: 0.6, color: '#ffaa00' }, // Orange
    { threshold: 0.8, color: '#ff5500' },
    { threshold: 1.0, color: '#ff0000' }, // Red
  ];

  for (let i = colors.length - 1; i >= 0; i--) {
    if (intensity >= colors[i].threshold) {
      return colors[i].color;
    }
  }
  return colors[0].color;
}

// Social Media utilities
export function getSentimentColor(category: string): string {
  const positiveCategories = ['Positive Feedback'];
  const negativeCategories = [
    'Service Issue',
    'Billing Issue',
    'Customer Service Complaint',
    'Corporate/PR Issue',
  ];

  if (positiveCategories.includes(category)) {
    return 'text-green-600 bg-green-50 border-green-200';
  } else if (negativeCategories.includes(category)) {
    return 'text-red-600 bg-red-50 border-red-200';
  } else {
    return 'text-blue-600 bg-blue-50 border-blue-200';
  }
}

export function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Service Issue': '⚠️',
    'Billing Issue': '💰',
    'Customer Service Complaint': '😠',
    'Positive Feedback': '🌟',
    'Sales Opportunity': '💼',
    'Feature Request': '💡',
    'Network Coverage': '📡',
    'Corporate/PR Issue': '🏢',
  };
  return iconMap[category] || '📝';
}

export function getPlatformIcon(platform: string): string {
  const iconMap: Record<string, string> = {
    Twitter: '𝕏',
    Reddit: '🤖',
    Facebook: '👥',
  };
  return iconMap[platform] || '📱';
}

export function formatSocialTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function getPriorityColor(priority: 'urgent' | 'high' | 'medium' | 'low'): string {
  const colorMap = {
    urgent: 'text-red-700 bg-red-100 border-red-300',
    high: 'text-orange-700 bg-orange-100 border-orange-300',
    medium: 'text-yellow-700 bg-yellow-100 border-yellow-300',
    low: 'text-gray-700 bg-gray-100 border-gray-300',
  };
  return colorMap[priority];
}

export function getDepartmentColor(department: 'Sales' | 'Support' | 'PR' | 'Tech'): string {
  const colorMap = {
    Sales: 'text-green-700 bg-green-50 border-green-200',
    Support: 'text-blue-700 bg-blue-50 border-blue-200',
    PR: 'text-purple-700 bg-purple-50 border-purple-200',
    Tech: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  };
  return colorMap[department];
}
