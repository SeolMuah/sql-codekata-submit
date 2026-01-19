// 프로그래머스 Content Script (SQL 전용)
(function() {
  'use strict';

  let isWaitingForResult = false;
  let hasProcessedResult = false;
  let checkResultInterval = null;

  // 문제 ID 추출
  function getProblemId() {
    const url = window.location.href;
    const match = url.match(/lessons\/(\d+)/);
    return match ? match[1] : null;
  }

  // 코드 추출
  function getCode() {
    // CodeMirror
    const cmEl = document.querySelector('.CodeMirror');
    console.log('[SPARTA] CodeMirror 요소:', cmEl);
    if (cmEl && cmEl.CodeMirror) {
      const code = cmEl.CodeMirror.getValue();
      console.log('[SPARTA] CodeMirror 코드 추출:', code?.substring(0, 50));
      return code;
    }

    // Monaco (프로그래머스에서 사용)
    console.log('[SPARTA] window.monaco:', !!window.monaco);
    if (window.monaco && window.monaco.editor) {
      const editors = window.monaco.editor.getEditors();
      console.log('[SPARTA] Monaco 에디터 수:', editors?.length);
      if (editors && editors.length > 0) {
        const code = editors[0].getValue();
        console.log('[SPARTA] Monaco 코드 추출:', code?.substring(0, 50));
        return code;
      }
    }

    // textarea 폴백
    const textarea = document.querySelector('textarea.editor') ||
                     document.querySelector('textarea[name="code"]') ||
                     document.querySelector('.editor textarea');
    if (textarea) {
      console.log('[SPARTA] textarea 코드 추출');
      return textarea.value;
    }

    console.log('[SPARTA] 코드 추출 실패!');
    return null;
  }

  // 정답 여부 감지 (개선된 버전)
  function detectResult() {
    // 1. 먼저 모달 다이얼로그 확인 (프로그래머스 채점 결과는 모달로 표시됨)
    const modal = document.querySelector('[role="dialog"]') ||
                  document.querySelector('.modal') ||
                  document.querySelector('[class*="Modal"]');

    if (modal) {
      const modalText = modal.textContent || '';
      console.log('[SPARTA] 모달 감지:', modalText.substring(0, 100));

      // 정답 모달
      if (modalText.includes('정답입니다')) {
        console.log('[SPARTA] 정답 모달 감지!');
        return true;
      }

      // 오답 모달
      if (modalText.includes('틀렸습니다')) {
        console.log('[SPARTA] 오답 모달 감지!');
        return false;
      }
    }

    // 2. 결과 영역에서 SQL 오류 등 확인
    const resultArea = document.querySelector('#output') ||
                       document.querySelector('.console-output') ||
                       document.querySelector('[class*="result"]');

    if (!resultArea) return null;

    const text = resultArea.textContent || '';
    console.log('[SPARTA] 결과 텍스트:', text.substring(0, 200));

    // 채점 중인 경우 (모달이 아직 안 나타남)
    if (text.includes('채점 중') || text.includes('채점을 시작') || text.includes('실행 중')) {
      // SQL 오류가 포함된 경우는 실패로 처리
      if (text.includes('오류') || text.includes('error') || text.includes('Error')) {
        console.log('[SPARTA] SQL 오류 감지');
        return false;
      }
      console.log('[SPARTA] 아직 채점 중...');
      return null;
    }

    // 기본 메시지인 경우
    if (text.includes('실행 결과가 여기에 표시됩니다') || text.trim() === '') {
      return null;
    }

    // SQL 오류 체크
    if (text.includes('오류가 발생') ||
        text.includes('런타임 에러') ||
        text.includes('시간 초과') ||
        text.includes('메모리 초과')) {
      console.log('[SPARTA] 오류 감지');
      return false;
    }

    // 정답 패턴
    if (text.includes('정답입니다') ||
        text.includes('테스트를 통과') ||
        text.includes('통과 (') ||
        text.includes('Pass') ||
        text.includes('맞았습니다') ||
        text.includes('100.0') ||
        /테스트 \d+.*통과/.test(text) ||
        /정확성.*100/.test(text)) {
      console.log('[SPARTA] 정답 감지!');
      return true;
    }

    // 오답 패턴
    if (text.includes('실패') ||
        text.includes('오답') ||
        text.includes('Fail') ||
        text.includes('틀렸') ||
        text.includes('실패 (') ||
        text.includes('0.0')) {
      console.log('[SPARTA] 오답 감지');
      return false;
    }

    // 테스트 결과 개수로 판별
    const passMatch = text.match(/(\d+)개 성공/);
    const failMatch = text.match(/(\d+)개 실패/);
    if (passMatch || failMatch) {
      const failCount = failMatch ? parseInt(failMatch[1]) : 0;
      return failCount === 0;
    }

    // 점수 영역 확인
    const scoreResult = checkScoreArea();
    if (scoreResult !== null) return scoreResult;

    return null;
  }

  // 점수 영역 확인
  function checkScoreArea() {
    const modal = document.querySelector('.modal-content') ||
                  document.querySelector('[class*="result-modal"]');

    if (modal) {
      const modalText = modal.textContent || '';
      if (modalText.includes('정답') || modalText.includes('100') || modalText.includes('통과')) {
        return true;
      } else if (modalText.includes('실패') || modalText.includes('오답')) {
        return false;
      }
    }

    const scoreEl = document.querySelector('.score') ||
                    document.querySelector('[class*="score"]');

    if (scoreEl) {
      const scoreText = scoreEl.textContent || '';
      const scoreMatch = scoreText.match(/(\d+(?:\.\d+)?)/);
      if (scoreMatch) {
        const score = parseFloat(scoreMatch[1]);
        if (score === 100) return true;
        if (score === 0) return false;
      }
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
    const titleEl = document.querySelector('.algorithm-title') ||
                    document.querySelector('.challenge-title') ||
                    document.querySelector('h2.challenge-title') ||
                    document.querySelector('[class*="lesson-title"]');
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
      // Extension context invalidated 에러 처리
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
    let problemInfo = findProblemByProblemId(problemId, 'programmers');
    const isRegistered = !!problemInfo;

    // 미등록 문제인 경우 - GitHub에는 제출 가능하도록 기본 정보 생성
    if (!problemInfo) {
      const titleFromPage = getProblemTitleFromPage();
      problemInfo = {
        id: null,  // 미등록 표시
        problemId: problemId,
        title: titleFromPage || problemId,
        platform: 'programmers',
        difficulty: null,  // 미등록
        url: window.location.href
      };
      console.log('[SPARTA] 미등록 문제 (GitHub만 제출):', problemId);
    }

    console.log('[SPARTA] 제출 감지:', { problemId, isCorrect, title: problemInfo.title, registered: isRegistered });

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

  // 결과 대기 (폴링 방식)
  function waitForResult() {
    let attempts = 0;
    const maxAttempts = 30;

    console.log('[SPARTA] 채점 결과 대기 시작...');

    if (checkResultInterval) {
      clearInterval(checkResultInterval);
    }

    checkResultInterval = setInterval(() => {
      attempts++;

      // 이미 처리됐으면 중단
      if (hasProcessedResult || !isWaitingForResult) {
        clearInterval(checkResultInterval);
        checkResultInterval = null;
        return;
      }

      const result = detectResult();
      if (result !== null) {
        clearInterval(checkResultInterval);
        checkResultInterval = null;
        console.log('[SPARTA] 결과 확정:', result ? '정답' : '오답');
        handleSubmission(result);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkResultInterval);
        checkResultInterval = null;
        isWaitingForResult = false;
        console.log('[SPARTA] 결과 대기 타임아웃');
      }
    }, 1000);
  }

  // 제출 버튼 감시
  function observeSubmitButton() {
    // 프로그래머스 실제 버튼 셀렉터
    const submitBtn = document.querySelector('#submit-code') ||
                      document.querySelector('button.btn-primary[type="submit"]') ||
                      Array.from(document.querySelectorAll('button')).find(
                        btn => btn.textContent.includes('제출') && btn.textContent.includes('채점')
                      );

    if (submitBtn && !submitBtn.dataset.spartaAttached) {
      submitBtn.dataset.spartaAttached = 'true';
      console.log('[SPARTA] 제출 버튼 연결됨:', submitBtn.textContent.trim());

      submitBtn.addEventListener('click', () => {
        console.log('[SPARTA] 제출 버튼 클릭!');
        // 새 제출 시작 - 플래그 초기화
        isWaitingForResult = true;
        hasProcessedResult = false;

        // 1.5초 후 결과 대기 시작
        setTimeout(() => {
          waitForResult();
        }, 1500);
      });
    }
  }

  // 초기화
  async function init() {
    const settings = await chrome.storage.sync.get(['studentName']);
    if (!settings.studentName) {
      showNotification('먼저 익스텐션에서 이름을 설정해주세요!', 'error');
      return;
    }

    console.log('[SPARTA] 코드카타 활성화 -', settings.studentName);
    observeSubmitButton();
    setInterval(observeSubmitButton, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
