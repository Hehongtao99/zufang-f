// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'UNPAID': return 'warning';
    case 'PAID': return 'success';
    case 'CANCELLED': return 'info';
    case 'PAYMENT_CANCELLED': return 'info';
    case 'REFUNDING': return 'warning';
    case 'REFUNDED': return 'info';
    case 'COMPLETED': return 'success';
    default: return 'info';
  }
};

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'UNPAID': return '待支付';
    case 'PAID': return '已支付';
    case 'CANCELLED': return '已取消';
    case 'PAYMENT_CANCELLED': return '取消支付';
    case 'REFUNDING': return '退款中';
    case 'REFUNDED': return '已退款';
    case 'COMPLETED': return '已完成';
    default: return '未知状态';
  }
}; 