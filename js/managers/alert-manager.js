/**
 * 알림 관리 모듈
 * - 알림 추가/표시
 * - 알림음 재생
 */

export class AlertManager {
  constructor(options = {}) {
    this.elements = options.elements || {};
    this.alertSound = options.alertSound || null;
    this.maxAlerts = options.maxAlerts || 50;
  }

  /**
   * 알림 추가
   */
  addAlert(message, type = 'info') {
    const alertList = this.elements.alertList;
    if (!alertList) return;

    // 빈 상태 메시지 제거
    const emptyMsg = alertList.querySelector('.text-center');
    if (emptyMsg) emptyMsg.remove();

    const alertItem = document.createElement('div');

    let alertStyle = 'bg-slate-50 border-slate-100';
    let iconStyle = 'text-slate-400';
    let icon = 'info';

    if (type === 'warning') {
      alertStyle = 'bg-orange-50 border-orange-100';
      iconStyle = 'text-orange-500';
      icon = 'warning';
    } else if (type === 'critical') {
      alertStyle = 'bg-red-50 border-red-100';
      iconStyle = 'text-red-500';
      icon = 'error';
    }

    alertItem.className = `flex items-start gap-2 p-2 rounded-lg border ${alertStyle}`;

    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    alertItem.innerHTML = `
      <span class="material-symbols-rounded ${iconStyle} text-sm flex-shrink-0 mt-0.5">${icon}</span>
      <div class="flex-1 min-w-0">
        <p class="text-xs text-slate-700 font-medium">${message}</p>
        <p class="text-[10px] text-slate-400 mt-0.5">${time}</p>
      </div>
    `;

    alertList.insertBefore(alertItem, alertList.firstChild);

    // 최대 개수 유지
    while (alertList.children.length > this.maxAlerts) {
      alertList.removeChild(alertList.lastChild);
    }
  }

  /**
   * 알림음 재생
   */
  playSound() {
    if (this.alertSound) {
      this.alertSound.currentTime = 0;
      this.alertSound.play().catch(() => { });
    }
  }

  /**
   * 알림 목록 초기화
   */
  clear() {
    const alertList = this.elements.alertList;
    if (!alertList) return;

    alertList.innerHTML = `
      <div class="flex flex-col items-center justify-center py-6 text-center text-slate-400">
        <div class="w-10 h-10 mb-2 rounded-full bg-slate-50 flex items-center justify-center">
          <span class="material-symbols-rounded text-lg opacity-50">notifications_off</span>
        </div>
        <h4 class="text-sm font-medium text-slate-500">알림이 없습니다</h4>
        <p class="text-xs opacity-70 mt-0.5">새 활동 시 알려드립니다.</p>
      </div>
    `;
  }
}
