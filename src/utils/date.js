/**
 * 格式化日期为 yyyy-MM-dd HH:mm 格式
 * @param {string|Date} dateStr 日期字符串或日期对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  
  // 如果日期无效则返回空字符串
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化日期为 yyyy-MM-dd 格式
 * @param {string|Date} dateStr 日期字符串或日期对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDateOnly(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  
  // 如果日期无效则返回空字符串
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 获取相对时间（如：刚刚、x分钟前、x小时前、x天前等）
 * @param {string|Date} dateStr 日期字符串或日期对象
 * @returns {string} 相对时间
 */
export function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  
  // 如果日期无效则返回空字符串
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 转换为秒
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) {
    return '刚刚';
  }
  
  // 转换为分钟
  const minutes = Math.floor(seconds / 60);
  
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }
  
  // 转换为小时
  const hours = Math.floor(minutes / 60);
  
  if (hours < 24) {
    return `${hours}小时前`;
  }
  
  // 转换为天
  const days = Math.floor(hours / 24);
  
  if (days < 30) {
    return `${days}天前`;
  }
  
  // 转换为月
  const months = Math.floor(days / 30);
  
  if (months < 12) {
    return `${months}个月前`;
  }
  
  // 转换为年
  const years = Math.floor(months / 12);
  return `${years}年前`;
} 