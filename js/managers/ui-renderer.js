/**
 * UI 렌더링 모듈
 * - 학생 카드 렌더링
 * - 통계 업데이트
 */
import { STATUS, STATUS_LABEL, FOCUS_COLOR } from '../config.js';

export class UIRenderer {
  constructor(options = {}) {
    this.elements = options.elements || {};
    this.studentManager = options.studentManager || null;

    // 콜백
    this.onOpenVideoModal = options.onOpenVideoModal || (() => { });
    this.onOpenFocusDetailModal = options.onOpenFocusDetailModal || (() => { });
    this.onOpenMessageModal = options.onOpenMessageModal || (() => { });
    this.onOpenAttendanceModal = options.onOpenAttendanceModal || (() => { });
    this.onOpenFocusReportModal = options.onOpenFocusReportModal || (() => { });
    this.onStartPTT = options.onStartPTT || (() => { });
    this.onStopPTT = options.onStopPTT || (() => { });
    this.onOpenScreenModal = options.onOpenScreenModal || (() => { });
  }

  /**
   * 학생 그리드 렌더링
   */
  renderStudentGrid(students) {
    const grid = this.elements.studentGrid;
    if (!grid) return;

    grid.innerHTML = '';

    if (students.size === 0) {
      grid.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-6 text-slate-400">
          <span class="material-symbols-rounded text-3xl mb-2 opacity-50">hourglass_empty</span>
          <p class="text-sm">접속한 학생이 없습니다</p>
        </div>
      `;
      return;
    }

    students.forEach((student) => {
      const card = this.createStudentCard(student);
      grid.appendChild(card);
    });
  }

  /**
   * 학생 카드 생성
   */
  createStudentCard(student) {
    const card = document.createElement('div');
    const statusStyle = this.getStatusStyle(student.status);

    // Premium Card Design: White clean card with subtle border and shadow
    card.className = `group relative bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-red-100 hover:-translate-y-1 transition-all duration-300 overflow-hidden`;
    card.setAttribute('data-peer-id', student.peerId);

    const statusInfo = this.getStatusInfo(student);
    const focusDisplay = this.getFocusDisplay(student);

    // Gradient top bar based on status
    const statusGradient = statusStyle.bg.includes('green') ? 'from-emerald-400 to-teal-500' :
      statusStyle.bg.includes('blue') ? 'from-blue-400 to-indigo-500' :
        statusStyle.bg.includes('red') ? 'from-red-500 to-rose-600' :
          statusStyle.bg.includes('purple') ? 'from-violet-500 to-purple-600' :
            statusStyle.bg.includes('amber') ? 'from-amber-400 to-orange-500' :
              'from-slate-300 to-slate-400';

    card.innerHTML = `
      <!-- Top Status Stripe (Gradient) -->
      <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${statusGradient} opacity-90"></div>

      <div class="p-5">
        <!-- Header: Name & Status -->
        <div class="flex items-start justify-between mb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-bold text-lg text-slate-800 tracking-tight">${student.name}</h3>
              <span class="text-[10px] text-slate-500 font-semibold px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200">${student.grade ? student.grade + '학년' : '학생'}</span>
            </div>
            <div class="flex items-center gap-2 mt-1">
               <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100">
                <span class="material-symbols-rounded text-sm ${statusStyle.textColor}">${statusStyle.icon}</span>
                <span class="text-xs font-semibold ${statusStyle.textColor}">${STATUS_LABEL[student.status]}</span>
              </div>
              ${statusInfo}
            </div>
          </div>
          
          <!-- Quick Action -->
           <button class="btn-view-video p-2 rounded-full bg-slate-50 text-slate-400 hover:text-white hover:bg-gradient-to-br hover:from-primary hover:to-red-600 transition-all shadow-sm hover:shadow-red-500/30 group-hover:opacity-100 opacity-0 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 delay-75" title="영상 확인">
            <span class="material-symbols-rounded text-[20px]">videocam</span>
          </button>
        </div>

        <!-- Body: Focus & Activity -->
        <div class="space-y-3">
          ${focusDisplay}
        </div>

        <!-- Footer: Actions (Hidden by default, shown on hover) -->
        <div class="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm border-t border-slate-100 p-2 flex items-center justify-around translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
            <button class="btn-ptt p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-emerald-500 transition-colors" title="음성 메시지">
              <span class="material-symbols-rounded">mic</span>
            </button>
            <button class="btn-send-message p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-indigo-500 transition-colors" title="메시지 전송">
              <span class="material-symbols-rounded">chat</span>
            </button>
            <button class="btn-focus-report p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-orange-500 transition-colors" title="집중도 보고서">
              <span class="material-symbols-rounded">assessment</span>
            </button>
            <button class="btn-attendance p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-teal-500 transition-colors" title="출석 현황">
              <span class="material-symbols-rounded">calendar_month</span>
            </button>
        </div>
      </div>
    `;

    this.bindCardEvents(card, student);
    return card;
  }

  /**
   * 카드 이벤트 바인딩
   */
  bindCardEvents(card, student) {
    // 영상 확인
    card.querySelector('.btn-view-video')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onOpenVideoModal(student.peerId, student.name);
    });

    // 집중도 상세
    card.querySelector('.btn-focus-detail')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onOpenFocusDetailModal(student.peerId);
    });

    // 메시지
    card.querySelector('.btn-send-message')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onOpenMessageModal(student.peerId, student.name);
    });

    // 출석
    card.querySelector('.btn-attendance')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onOpenAttendanceModal(student.name);
    });

    // 집중도 보고서
    card.querySelector('.btn-focus-report')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onOpenFocusReportModal(student.name, student.grade);
    });

    // 화면 썸네일 클릭
    card.querySelector('.screen-thumbnail')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onOpenScreenModal(student.peerId);
    });
    card.querySelector('.btn-view-screen')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onOpenScreenModal(student.peerId);
    });

    // PTT
    const pttBtn = card.querySelector('.btn-ptt');
    if (pttBtn) {
      pttBtn.addEventListener('mousedown', async (e) => {
        e.stopPropagation();
        await this.onStartPTT(student.peerId, student.name, pttBtn);
      });
      pttBtn.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        this.onStopPTT(student.peerId, pttBtn);
      });
      pttBtn.addEventListener('mouseleave', () => {
        this.onStopPTT(student.peerId, pttBtn);
      });
      pttBtn.addEventListener('touchstart', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this.onStartPTT(student.peerId, student.name, pttBtn);
      });
      pttBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onStopPTT(student.peerId, pttBtn);
      });
    }
  }

  /**
   * 상태별 스타일
   */
  getStatusStyle(status) {
    const styles = {
      [STATUS.STANDING]: {
        bg: 'bg-white',
        border: 'border-l-4 border-l-emerald-500 border-slate-200',
        icon: 'accessibility_new',
        iconColor: 'text-emerald-500',
        textColor: 'text-emerald-600'
      },
      [STATUS.SITTING]: {
        bg: 'bg-white',
        border: 'border-l-4 border-l-blue-500 border-slate-200',
        icon: 'weekend',
        iconColor: 'text-blue-500',
        textColor: 'text-blue-600'
      },
      [STATUS.AWAY]: {
        bg: 'bg-white',
        border: 'border-l-4 border-l-red-500 border-slate-200',
        icon: 'person_off',
        iconColor: 'text-red-500',
        textColor: 'text-red-600'
      },
      [STATUS.HAND_RAISED]: {
        bg: 'bg-white',
        border: 'border-l-4 border-l-purple-500 border-slate-200',
        icon: 'pan_tool',
        iconColor: 'text-purple-500',
        textColor: 'text-purple-600'
      },
      [STATUS.NO_RESPONSE]: {
        bg: 'bg-white',
        border: 'border-l-4 border-l-amber-500 border-slate-200',
        icon: 'wifi_off',
        iconColor: 'text-amber-500',
        textColor: 'text-amber-600'
      },
      [STATUS.DISCONNECTED]: {
        bg: 'bg-slate-50',
        border: 'border-l-4 border-l-slate-400 border-slate-200',
        icon: 'link_off',
        iconColor: 'text-slate-400',
        textColor: 'text-slate-500'
      }
    };

    return styles[status] || {
      bg: 'bg-white',
      border: 'border-slate-200',
      icon: 'hourglass_empty',
      iconColor: 'text-slate-400',
      textColor: 'text-slate-500'
    };
  }

  /**
   * 상태 정보 HTML
   */
  getStatusInfo(student) {
    if (student.status === STATUS.AWAY && student.awayStartTime) {
      const seconds = Math.floor((Date.now() - student.awayStartTime) / 1000);
      return `<p class="text-[10px] text-red-500 font-medium away-timer">${this.formatTime(seconds)}</p>`;
    } else if (student.status === STATUS.NO_RESPONSE && student.noResponseAt) {
      const seconds = Math.floor((Date.now() - student.noResponseAt) / 1000);
      return `<p class="text-[10px] text-amber-500 font-medium no-response-timer">응답없음 ${this.formatTime(seconds)}</p>`;
    } else if (student.status === STATUS.DISCONNECTED && student.disconnectedAt) {
      const seconds = Math.floor((Date.now() - student.disconnectedAt) / 1000);
      return `<p class="text-[10px] text-slate-400 font-medium">연결끊김 ${seconds}초</p>`;
    }
    return '';
  }

  /**
   * 집중도 표시 HTML
   */
  getFocusDisplay(student) {
    let html = '';

    // 화면 공유 중이면 썸네일 표시
    if (student.isScreenSharing && student.screenThumbnail) {
      html += `
        <div class="screen-thumbnail-container mt-2 pt-2 border-t border-slate-100">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] text-slate-400 flex items-center gap-1">
              <span class="material-symbols-rounded text-xs text-indigo-500">screen_share</span>
              화면 공유 중
            </span>
            <button class="btn-view-screen text-[10px] text-indigo-500 hover:text-indigo-600 font-medium">확대</button>
          </div>
          <img class="screen-thumbnail w-full rounded-md border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity" src="${student.screenThumbnail}" />
        </div>
      `;
    } else if (student.isScreenSharing) {
      html += `
        <div class="mt-2 pt-2 border-t border-slate-100">
          <div class="flex items-center gap-1 text-[10px] text-indigo-500">
            <span class="material-symbols-rounded text-xs">screen_share</span>
            화면 공유 대기 중...
          </div>
        </div>
      `;
    }

    if (student.focus && student.status !== STATUS.DISCONNECTED && student.status !== STATUS.NO_RESPONSE) {
      const focusColor = FOCUS_COLOR[student.focus.level] || '#94A3B8';
      // Use brand color for high focus
      const displayColor = student.focus.level === 'high' ? '#E30000' : focusColor; // Primary Red

      html += `
        <div class="mt-2 pt-2 border-t border-slate-100">
          <div class="flex items-center justify-between text-[10px] mb-1">
            <span class="text-slate-400">집중도</span>
            <span class="font-bold focus-score" style="color: ${displayColor}">${student.focus.score}%</span>
          </div>
          <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-300 focus-bar" style="width: ${student.focus.score}%; background-color: ${displayColor}"></div>
          </div>
        </div>
      `;
    }
    return html;
  }

  /**
   * 통계 업데이트
   */
  updateStats(stats) {
    if (this.elements.totalStudents) {
      this.elements.totalStudents.textContent = stats.total;
    }
    if (this.elements.standingCount) {
      this.elements.standingCount.textContent = stats.standing;
    }
    if (this.elements.sittingCount) {
      this.elements.sittingCount.textContent = stats.sitting;
    }
    if (this.elements.awayCount) {
      this.elements.awayCount.textContent = stats.away;
    }
    if (this.elements.handRaisedCount) {
      this.elements.handRaisedCount.textContent = stats.handRaised;
    }
  }

  /**
   * 시간 포맷
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs.toString().padStart(2, '0')}초`;
  }

  formatLastUpdate(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return '방금 전';
    if (seconds < 60) return `${seconds}초 전`;
    return `${Math.floor(seconds / 60)}분 전`;
  }
}
