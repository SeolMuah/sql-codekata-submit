// HackerRank Content Script (SQL 전용)
(function() {
  'use strict';

  let isWaitingForResult = false;
  let hasProcessedResult = false;

  // 문제 ID 추출 (slug)
  function getProblemId() {
    const url = window.location.href;
    const match = url.match(/challenges\/([^\/]+)/);
    return match ? match[1] : null;
  }

  // 코드 추출
  function getCode() {
    // Monaco 에디터
    if (window.monaco) {
      const editors = window.monaco.editor.getEditors();
      if (editors.length > 0) {
        return editors[0].getValue();
      }
    }
    // CodeMirror
    const cmEl = document.querySelector('.CodeMirror');
    if (cmEl && cmEl.CodeMirror) {
      return cmEl.CodeMirror.getValue();
    }
    // 에디터 textarea
    const textarea = document.querySelector('.custom-input') ||
                     document.querySelector('textarea.inputarea');
    if (textarea) {
      return textarea.value;
    }
    return null;
  }

  // 제출 결과 감지
  function detectResult() {
    // 채점 결과
    const resultEl = document.querySelector('.submission-status') ||
                     document.querySelector('[class*="judge-status"]') ||
                     document.querySelector('.status') ||
                     document.querySelector('.challenge-response');

    if (!resultEl) return null;

    const text = resultEl.textContent.toLowerCase();

    if (text.includes('accepted') || text.includes('pass') ||
        text.includes('correct') || text.includes('success') ||
        text.includes('congratulations')) {
      return true;
    } else if (text.includes('wrong') || text.includes('fail') ||
               text.includes('error') || text.includes('terminated')) {
      return false;
    }

    return null;
  }

  // 알림 표시
  function showNotification(message, type = 'success') {
    const existing = document.getElementById('sparta-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'sparta-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 14px 24px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    const style = document.createElement('style');
    style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
    document.head.appendChild(style);

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  // 페이지에서 문제 제목 추출
  function getProblemTitleFromPage() {
    const titleEl = document.querySelector('.challenge-name-label') ||
                    document.querySelector('h1.challenge-name') ||
                    document.querySelector('.challenge-view h2') ||
                    document.querySelector('[class*="challenge-title"]');
    if (titleEl) {
      return titleEl.textContent.trim();
    }
    return null;
  }

  // 구글 폼 제출
  async function submitToGoogleForm(problemInfo, code, githubUrl = '') {
    // Google Form 드롭다운과 동일한 형식: "번호 - 제목"
    const problemTitle = `${problemInfo.id} - ${problemInfo.title}`;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SUBMIT_TO_GOOGLE_FORM',
        data: {
          problemTitle: problemTitle,
          code: code,
          github: githubUrl
        }
      });

      if (response && response.success) {
        console.log('[SPARTA] 구글 폼 제출 성공!');
        showNotification('구글 폼에 자동 제출되었습니다!', 'success');
        await markAsSolved(problemInfo.id);
      } else {
        console.error('[SPARTA] 구글 폼 제출 실패:', response?.error);
        showNotification('구글 폼 제출 실패: ' + (response?.error || '알 수 없는 오류'), 'error');
      }
    } catch (error) {
      console.error('[SPARTA] 구글 폼 제출 오류:', error);
      if (error.message && error.message.includes('Extension context invalidated')) {
        showNotification('익스텐션이 업데이트되었습니다. 페이지를 새로고침해주세요!', 'error');
      } else {
        showNotification('구글 폼 제출 오류: ' + error.message, 'error');
      }
    }
  }

  // GitHub 제출
  async function submitToGitHub(problem, code) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SUBMIT_TO_GITHUB',
        data: {
          problem: problem,
          code: code
        }
      });

      if (response && response.success) {
        console.log('[SPARTA] GitHub 제출 성공:', response.url);
        showNotification('GitHub에 업로드 완료!', 'success');
        return response.url;
      } else {
        console.error('[SPARTA] GitHub 제출 실패:', response?.error);
        showNotification('GitHub 제출 실패: ' + (response?.error || '알 수 없는 오류'), 'error');
        return null;
      }
    } catch (error) {
      console.error('[SPARTA] GitHub 제출 오류:', error);
      if (error.message && error.message.includes('Extension context invalidated')) {
        showNotification('익스텐션이 업데이트되었습니다. 페이지를 새로고침해주세요!', 'error');
      }
      return null;
    }
  }

  // 푼 문제 저장
  async function markAsSolved(problemId) {
    const stored = await chrome.storage.sync.get(['solvedProblems']);
    const solved = stored.solvedProblems || [];
    if (!solved.includes(problemId)) {
      solved.push(problemId);
      await chrome.storage.sync.set({ solvedProblems: solved });
      console.log('[SPARTA] 문제 완료 기록:', problemId);
    }
  }

  // 이미 제출된 문제인지 확인
  async function isAlreadySubmitted(problemId) {
    const stored = await chrome.storage.sync.get(['solvedProblems']);
    const solved = stored.solvedProblems || [];
    return solved.includes(problemId);
  }

  // 네트워크 상태 확인
  function isOnline() {
    return navigator.onLine;
  }

  // 제출 처리 (한 번만 실행)
  async function handleSubmission(isCorrect) {
    if (hasProcessedResult) {
      console.log('[SPARTA] 이미 처리된 결과, 무시');
      return;
    }
    hasProcessedResult = true;
    isWaitingForResult = false;

    // 네트워크 상태 확인
    if (!isOnline()) {
      showNotification('네트워크 연결이 없습니다. 인터넷 연결을 확인해주세요.', 'error');
      return;
    }

    const problemId = getProblemId();
    if (!problemId) return;

    // 등록된 문제 정보 조회
    let problemInfo = findProblemByProblemId(problemId, 'hackerrank');
    const isRegistered = !!problemInfo;

    // 미등록 문제인 경우 - GitHub에는 제출 가능하도록 기본 정보 생성
    if (!problemInfo) {
      const titleFromPage = getProblemTitleFromPage();
      problemInfo = {
        id: null,  // 미등록 표시
        problemId: problemId,
        title: titleFromPage || problemId,
        platform: 'hackerrank',
        difficulty: null,  // 미등록
        url: window.location.href
      };
      console.log('[SPARTA] 미등록 문제 (GitHub만 제출):', problemId);
    }

    console.log('[SPARTA] HackerRank 제출 감지:', { problemId, isCorrect, title: problemInfo.title, registered: isRegistered });

    if (isCorrect === true) {
      // 등록된 문제만 중복 체크
      if (isRegistered && await isAlreadySubmitted(problemInfo.id)) {
        console.log('[SPARTA] 이미 제출 완료된 문제:', problemInfo.id);
        showNotification('이미 제출된 문제입니다!', 'info');
        return;
      }

      const code = getCode();
      if (!code) {
        showNotification('코드 추출 실패. 다시 시도해주세요.', 'error');
        return;
      }
      let githubUrl = '';

      // GitHub 자동 제출 확인
      const settings = await chrome.storage.sync.get(['githubAutoSubmit', 'githubRepo']);
      const tokenData = await chrome.storage.local.get(['githubToken']);

      if (settings.githubAutoSubmit && settings.githubRepo && tokenData.githubToken) {
        showNotification('정답입니다! GitHub에 업로드 중...', 'success');
        githubUrl = await submitToGitHub(problemInfo, code) || '';
      }

      // 등록된 문제만 구글 폼에 제출
      if (isRegistered) {
        showNotification('구글 폼에 제출 중...', 'success');
        await submitToGoogleForm(problemInfo, code, githubUrl);
      } else {
        // 미등록 문제는 GitHub만 제출
        if (!githubUrl) {
          showNotification('미등록 문제입니다. GitHub 연동 시 자동 저장됩니다.', 'info');
        }
      }
    } else if (isCorrect === false) {
      showNotification('오답입니다. 다시 시도해보세요!', 'error');
    }
  }

  // 결과 대기 (제출 버튼 클릭 후에만 실행)
  function waitForResult() {
    let attempts = 0;
    const maxAttempts = 60;

    const checkResult = setInterval(() => {
      attempts++;
      if (hasProcessedResult || !isWaitingForResult) {
        clearInterval(checkResult);
        return;
      }
      const result = detectResult();
      if (result !== null) {
        clearInterval(checkResult);
        handleSubmission(result);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkResult);
        isWaitingForResult = false;
        console.log('[SPARTA] 결과 대기 시간 초과');
      }
    }, 1000);
  }

  // 제출 버튼 감시
  function observeSubmitButton() {
    const submitBtn = document.querySelector('.hr-monaco-submit') ||
                      document.querySelector('.submit-btn-large') ||
                      document.querySelector('button[data-analytics="Submit Code"]');

    if (submitBtn && !submitBtn.dataset.spartaAttached) {
      submitBtn.dataset.spartaAttached = 'true';
      submitBtn.addEventListener('click', () => {
        console.log('[SPARTA] HackerRank 제출 버튼 클릭!');
        isWaitingForResult = true;
        hasProcessedResult = false;
        waitForResult();
      });
      console.log('[SPARTA] 제출 버튼 연결 완료');
    }
  }

  // 초기화
  async function init() {
    const settings = await chrome.storage.sync.get(['studentName']);
    if (!settings.studentName) {
      showNotification('먼저 익스텐션에서 이름을 설정해주세요!', 'error');
      return;
    }

    console.log('[SPARTA] HackerRank 코드카타 활성화 -', settings.studentName);
    observeSubmitButton();
    setInterval(observeSubmitButton, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
