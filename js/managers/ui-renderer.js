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
   * 학생 행(Row) 생성 (리스트 뷰)
   */
  createStudentCard(student) {
    const row = document.createElement('div');
    const statusStyle = this.getStatusStyle(student.status);

    // Row Layout: Name | Graph | Avg Score | Actions
    row.className = `student-row group flex items-center justify-between p-4 bg-white border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors mx-2 rounded-xl`;
    row.setAttribute('data-peer-id', student.peerId);

    // Calculate 10-min Average
    const validHistory = student.focusHistory.filter(h => h.score > 0);
    const avgScore = validHistory.length > 0
      ? Math.round(validHistory.reduce((a, b) => a + b.score, 0) / validHistory.length)
      : 0;

    // Status Color for Gradient/Text
    let statusColorClass = 'text-slate-500';
    if (student.status === STATUS.AWAY) statusColorClass = 'text-red-500';
    else if (student.status === STATUS.STANDING) statusColorClass = 'text-emerald-500';
    else if (student.status === STATUS.SITTING) statusColorClass = 'text-blue-500';
    else if (student.status === STATUS.HAND_RAISED) statusColorClass = 'text-purple-500';

    row.innerHTML = `
      <!-- 1. Student Info -->
      <div class="flex items-center gap-4 w-[250px]">
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-slate-800 text-base">${student.name}</h3>
            <h3 class="font-bold text-slate-800 text-base">${student.name}</h3>
            <span class="text-[10px] text-slate-400 font-medium">${student.grade ? student.grade + '학년' : ''}</span>
          </div>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="material-symbols-rounded text-sm ${statusStyle.textColor}">${statusStyle.icon}</span>
            <span class="text-xs font-medium ${statusStyle.textColor}">${STATUS_LABEL[student.status]}</span>
            ${this.getStatusInfo(student)}
          </div>
        </div>
      </div>

      <!-- 2. Focus Information (Graph & Current) -->
      <div class="flex-1 flex items-center justify-center px-4 gap-6">
        <!-- 5-min Trend Graph -->
        <div class="flex flex-col items-center w-full max-w-[200px]">
          <canvas class="focus-sparkline w-full h-[40px]" width="200" height="40"></canvas>
        </div>
        
        <!-- Current Score (Small) -->
        <div class="text-center w-[80px]">
           <div class="text-xl font-bold ${student.focus?.level === 'high' ? 'text-primary' : 'text-slate-700'}">
             ${student.focus ? student.focus.score : '-'}%
           </div>
        </div>
      </div>

      <!-- 3. 10-min Avg -->
      <div class="w-[120px] text-center border-l border-slate-100 pl-4">
        <div class="text-2xl font-bold text-slate-800">${avgScore}%</div>
      </div>

      <!-- 4. Actions -->
      <div class="flex items-center gap-1 pl-4">
         <button class="btn-view-video p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors" title="영상 확인">
          <span class="material-symbols-rounded">videocam</span>
        </button>
        <button class="btn-send-message p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors" title="메시지">
          <span class="material-symbols-rounded">chat</span>
        </button>
        <button class="btn-focus-report p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors" title="리포트">
          <span class="material-symbols-rounded">assessment</span>
        </button>
      </div>
    `;

    // Draw Sparkline
    setTimeout(() => {
      const canvas = row.querySelector('.focus-sparkline');
      if (canvas && student.focusHistory.length > 0) {
        this.drawSparkline(canvas, student.focusHistory);
      }
    }, 0);

    this.bindCardEvents(row, student);
    return row;
  }

  /**
   * 개별 카드 부분 업데이트 (Row Layout)
   */
  updateStudentCard(peerId, student) {
    const row = this.elements.studentGrid?.querySelector(`[data-peer-id="${peerId}"]`);
    if (!row) return;

    // Update Score
    if (student.focus) {
      // Update Score
      // Current score is .text-xl
      const currentScoreEl = row.querySelector('.text-xl.font-bold');
      if (currentScoreEl) {
        currentScoreEl.textContent = `${student.focus.score}%`;

        // Remove old color classes
        currentScoreEl.classList.remove('text-primary', 'text-slate-700', 'text-slate-400', 'text-red-500');

        // Add new color class
        if (student.focus.level === 'high') currentScoreEl.classList.add('text-primary');
        else currentScoreEl.classList.add('text-slate-700');
      }

      // Update Sparkline
      const canvas = row.querySelector('.focus-sparkline');
      if (canvas) {
        this.drawSparkline(canvas, student.focusHistory);
      }
    }

    // Update Avg Score
    const avgEl = row.querySelector('.text-2xl.font-bold');
    if (avgEl) {
      const validHistory = student.focusHistory.filter(h => h.score > 0);
      const avgScore = validHistory.length > 0
        ? Math.round(validHistory.reduce((a, b) => a + b.score, 0) / validHistory.length)
        : 0;
      avgEl.textContent = `${avgScore}%`;
    }

    // Update Status Badge & Info
    const statusLabel = row.querySelector('.text-xs.font-medium');
    const statusIcon = row.querySelector('.material-symbols-rounded.text-sm');

    if (statusLabel && statusIcon) {
      const statusStyle = this.getStatusStyle(student.status);

      statusLabel.textContent = STATUS_LABEL[student.status];
      statusIcon.textContent = statusStyle.icon;

      // Update classes
      // Note: Use setAttribute or assignment to completely replace
      statusLabel.className = `text-xs font-medium ${statusStyle.textColor}`;
      statusIcon.className = `material-symbols-rounded text-sm ${statusStyle.textColor}`;
    }
  }

  /**
   * Draw Sparkline Graph
   */
  drawSparkline(canvas, history) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Use last 5 minutes (300 seconds)
    const data = history.slice(-300);
    if (data.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = '#E30000'; // Primary Red
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const stepX = width / (data.length - 1);

    data.forEach((point, i) => {
      const x = i * stepX;
      // y is inverted (100 is top, 0 is bottom)
      const y = height - (point.score / 100 * height);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Add fill gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(227, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(227, 0, 0, 0)');

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
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
        border: 'border-l-4 border-l-slate-600 border-slate-200',
        icon: 'accessibility_new',
        iconColor: 'text-slate-600',
        textColor: 'text-slate-700'
      },
      [STATUS.SITTING]: {
        bg: 'bg-white',
        border: 'border-l-4 border-l-slate-900 border-slate-200',
        icon: 'weekend',
        iconColor: 'text-slate-900',
        textColor: 'text-slate-900'
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
        border: 'border-l-4 border-l-slate-900 border-slate-200',
        icon: 'pan_tool',
        iconColor: 'text-slate-900',
        textColor: 'text-slate-900'
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
              <span class="material-symbols-rounded text-xs text-primary">screen_share</span>
              화면 공유 중
            </span>
            <button class="btn-view-screen text-[10px] text-primary hover:text-red-700 font-medium">확대</button>
          </div>
          <img class="screen-thumbnail w-full rounded-md border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity" src="${student.screenThumbnail}" />
        </div>
      `;
    } else if (student.isScreenSharing) {
      html += `
        <div class="mt-2 pt-2 border-t border-slate-100">
          <div class="flex items-center gap-1 text-[10px] text-slate-500">
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
