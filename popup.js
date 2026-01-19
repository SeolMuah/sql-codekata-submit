// Popup 스크립트 - 플랫폼 탭 + 난이도별 필터링 UI
console.log('[SPARTA] popup.js 로드됨');

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[SPARTA] DOMContentLoaded 실행');

  // DOM 요소 - 프로필
  const profileSetup = document.getElementById('profileSetup');
  const profileDisplay = document.getElementById('profileDisplay');
  const studentNameInput = document.getElementById('studentName');
  const saveNameBtn = document.getElementById('saveNameBtn');
  const changeNameBtn = document.getElementById('changeNameBtn');
  const currentNameSpan = document.getElementById('currentName');

  // DOM 요소 - 진행률
  const headerStats = document.getElementById('headerStats');
  const totalPercent = document.getElementById('totalPercent');
  const progCount = document.getElementById('progCount');
  const leetCount = document.getElementById('leetCount');
  const hackCount = document.getElementById('hackCount');

  // DOM 요소 - 탭
  const progTabCount = document.getElementById('progTabCount');
  const leetTabCount = document.getElementById('leetTabCount');
  const hackTabCount = document.getElementById('hackTabCount');

  // DOM 요소 - 다음 문제
  const nextProblemContainer = document.getElementById('nextProblemContainer');
  const completeContainer = document.getElementById('completeContainer');
  const nextProblem = document.getElementById('nextProblem');
  const nextTitle = document.getElementById('nextTitle');
  const nextDifficulty = document.getElementById('nextDifficulty');
  const nextPlatform = document.getElementById('nextPlatform');

  // DOM 요소 - 설정 (구글 폼) - 설정 탭
  const formSetup = document.getElementById('formSetup');
  const formDisplay = document.getElementById('formDisplay');
  const googleFormUrlInput = document.getElementById('googleFormUrl');
  const saveFormBtn = document.getElementById('saveFormBtn');
  const formStatus = document.getElementById('formStatus');
  const formEntryInfo = document.getElementById('formEntryInfo');
  const entryDetails = document.getElementById('entryDetails');
  const changeFormBtn = document.getElementById('changeFormBtn');
  const resetBtn = document.getElementById('resetBtn');

  // DOM 요소 - 메인 UI 구글 폼 설정 (최초 설정용)
  const mainFormSetup = document.getElementById('mainFormSetup');
  const mainGoogleFormUrlInput = document.getElementById('mainGoogleFormUrl');
  const mainSaveFormBtn = document.getElementById('mainSaveFormBtn');
  const mainFormStatus = document.getElementById('mainFormStatus');

  // DOM 요소 - GitHub
  const githubLoginSection = document.getElementById('githubLoginSection');
  const deviceCodeSection = document.getElementById('deviceCodeSection');
  const githubUserSection = document.getElementById('githubUserSection');
  const loginWithGithub = document.getElementById('loginWithGithub');
  const userCodeDisplay = document.getElementById('userCode');
  const deviceCodeStatus = document.getElementById('deviceCodeStatus');
  const githubAvatar = document.getElementById('githubAvatar');
  const githubName = document.getElementById('githubName');
  const githubLogout = document.getElementById('githubLogout');
  const repoSelect = document.getElementById('repoSelect');
  const createRepoBtn = document.getElementById('createRepoBtn');
  const githubAutoSubmit = document.getElementById('githubAutoSubmit');
  const toastEl = document.getElementById('toast');

  // 현재 추천 문제
  let currentNextProblem = null;

  // 인증 상태 감시 인터벌 (최상단에 선언해야 temporal dead zone 회피)
  let authWatchInterval = null;

  // 저장된 데이터 로드
  const stored = await chrome.storage.sync.get(['studentName', 'solvedProblems', 'googleFormUrl', 'formEntries']);
  const studentName = stored.studentName || '';
  let solvedProblems = stored.solvedProblems || [];

  // 플랫폼별 문제 수
  const PLATFORM_COUNTS = {
    programmers: 76,
    leetcode: 50,
    hackerrank: 58
  };

  // 플랫폼 이름
  const PLATFORM_NAMES = {
    programmers: '프로그래머스',
    leetcode: 'LeetCode',
    hackerrank: 'HackerRank'
  };

  // 난이도 이름
  const DIFFICULTY_NAMES = {
    1: '입문',
    2: '기초',
    3: '중급',
    4: '고급',
    5: '심화'
  };

  // 초기화
  if (studentName) {
    showNameDisplay(studentName);
  } else {
    showNameSetup();
  }

  // Google Form 상태 복원
  if (stored.googleFormUrl && stored.formEntries) {
    // 이미 설정됨 - 메인 UI에서 숨기고 설정 탭에서 표시
    mainFormSetup.classList.add('hidden');
    showFormConnected(stored.formEntries);
  } else if (stored.googleFormUrl) {
    googleFormUrlInput.value = stored.googleFormUrl;
    formStatus.textContent = '✅ 폼 연결됨';
    formStatus.style.color = '#22c55e';
    // 메인 UI에서도 숨김
    mainFormSetup.classList.add('hidden');
  } else {
    // 아직 설정 안됨 - 메인 UI에 표시
    mainFormSetup.classList.remove('hidden');
  }

  // UI 업데이트
  updateProgress(solvedProblems);
  showNextProblem(solvedProblems);
  initTabs();
  renderAllPlatforms(solvedProblems);
  initEventDelegation();

  // GitHub 초기화
  initGitHub();

  // ========== 인증 상태 자동 업데이트 리스너 ==========

  // 인증 상태 확인 및 UI 업데이트 함수 (재사용)
  async function checkAndUpdateAuthState() {
    try {
      const authResult = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
      console.log('[SPARTA] 인증 상태 업데이트:', authResult);

      if (authResult.success && authResult.authenticated && authResult.user) {
        showGitHubLoggedIn(authResult.user);
        await loadUserReposFromBackground();

        if (authResult.repo) {
          repoSelect.value = authResult.repo;
        }

        showToast('GitHub 로그인 성공!');
        resetLoginUI();
      }
    } catch (error) {
      console.error('[SPARTA] 인증 상태 업데이트 오류:', error);
    }
  }

  // 백그라운드에서 저장소 목록 로드
  async function loadUserReposFromBackground() {
    try {
      const result = await chrome.runtime.sendMessage({ type: 'GET_USER_REPOS' });
      if (result.success) {
        repoSelect.innerHTML = '<option value="">저장소 선택...</option>';
        result.repos.forEach(repo => {
          const option = document.createElement('option');
          option.value = repo.full_name;
          option.textContent = repo.name + (repo.private ? ' 🔒' : '');
          repoSelect.appendChild(option);
        });

        // 이전에 선택한 저장소 복원
        const { githubRepo } = await chrome.storage.sync.get(['githubRepo']);
        if (githubRepo) {
          repoSelect.value = githubRepo;
        }
      }
    } catch (error) {
      console.error('[SPARTA] 저장소 목록 로드 오류:', error);
    }
  }

  // Storage 변경 감지 리스너 - 토큰 변경 시 즉시 UI 업데이트
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      // 토큰이 추가됨 (로그인 성공)
      if (changes.githubToken?.newValue && !changes.githubToken?.oldValue) {
        console.log('[SPARTA] 토큰 감지됨 - UI 업데이트');
        checkAndUpdateAuthState();
      }
      // 토큰이 삭제됨 (로그아웃)
      if (!changes.githubToken?.newValue && changes.githubToken?.oldValue) {
        console.log('[SPARTA] 토큰 삭제됨 - 로그아웃 상태로 전환');
        showGitHubLoggedOut();
      }
    }
  });

  // Background에서 브로드캐스트 수신 - 즉시 UI 업데이트
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'AUTH_SUCCESS') {
      console.log('[SPARTA] AUTH_SUCCESS 브로드캐스트 수신');
      checkAndUpdateAuthState();
    }
  });

  // 인증 상태 변화 감시 (백그라운드 폴링 결과 확인)
  function watchAuthStatusChanges() {
    // 기존 인터벌 정리
    if (authWatchInterval) {
      clearInterval(authWatchInterval);
    }

    console.log('[SPARTA] 인증 상태 감시 시작');

    authWatchInterval = setInterval(async () => {
      try {
        const authResult = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });

        if (authResult.success && authResult.authenticated) {
          // 로그인 성공!
          console.log('[SPARTA] 인증 성공 감지!');
          clearInterval(authWatchInterval);
          authWatchInterval = null;

          // UI 상태 업데이트
          showGitHubLoggedIn(authResult.user);
          await loadUserReposFromBackground();

          if (authResult.repo) {
            repoSelect.value = authResult.repo;
          }

          showToast('GitHub 로그인 성공!');
          resetLoginUI();
        }
      } catch (error) {
        // 에러 무시 (팝업이 닫히면 발생할 수 있음)
        console.log('[SPARTA] 인증 상태 확인 중 오류 (무시됨):', error.message);
      }
    }, 1000); // 1초마다 확인

    // 15분 후 자동 중단 (토큰 만료 시간)
    setTimeout(() => {
      if (authWatchInterval) {
        console.log('[SPARTA] 인증 감시 타임아웃 (15분)');
        clearInterval(authWatchInterval);
        authWatchInterval = null;
        resetLoginUI();
      }
    }, 15 * 60 * 1000);
  }

  // 로그인 UI 리셋
  function resetLoginUI() {
    // 인증 감시 인터벌 정리
    if (authWatchInterval) {
      clearInterval(authWatchInterval);
      authWatchInterval = null;
    }

    loginWithGithub.disabled = false;
    loginWithGithub.innerHTML = `
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      GitHub로 로그인
    `;
    githubLoginSection.classList.remove('hidden');
    deviceCodeSection.classList.add('hidden');
  }

  // ========== 이벤트 리스너 ==========

  // 이름 저장
  saveNameBtn.addEventListener('click', async () => {
    const name = studentNameInput.value.trim();
    if (!name) {
      showToast('이름을 입력해주세요');
      return;
    }
    await chrome.storage.sync.set({ studentName: name });
    showNameDisplay(name);
    showToast('저장되었습니다');
  });

  // 이름 변경
  changeNameBtn.addEventListener('click', () => {
    showNameSetup();
    studentNameInput.value = currentNameSpan.textContent;
    studentNameInput.focus();
  });

  // 다음 문제 클릭
  nextProblem.addEventListener('click', () => {
    if (currentNextProblem) {
      const url = getProblemUrl(currentNextProblem);
      chrome.tabs.create({ url });
    }
  });

  // 폼 변경 버튼
  changeFormBtn.addEventListener('click', () => {
    formSetup.classList.remove('hidden');
    formDisplay.classList.add('hidden');
  });

  // 구글 폼 저장 (설정 탭)
  saveFormBtn.addEventListener('click', () => handleFormSave(googleFormUrlInput, formStatus));

  // 구글 폼 저장 (메인 UI - 최초 설정용)
  mainSaveFormBtn.addEventListener('click', () => handleFormSave(mainGoogleFormUrlInput, mainFormStatus));

  // 구글 폼 저장 공통 함수
  async function handleFormSave(urlInput, statusEl) {
    const url = urlInput.value.trim();
    if (!url) {
      statusEl.textContent = '❌ URL을 입력해주세요';
      statusEl.style.color = '#ef4444';
      return;
    }

    if (!url.includes('docs.google.com/forms')) {
      statusEl.textContent = '❌ 올바른 구글 폼 URL이 아닙니다';
      statusEl.style.color = '#ef4444';
      return;
    }

    statusEl.textContent = '⏳ 연결 중...';
    statusEl.style.color = '#fbbf24';

    try {
      let formUrl = url;
      if (url.includes('/edit')) {
        formUrl = url.replace('/edit', '/viewform');
      } else if (!url.includes('/viewform')) {
        formUrl = url.replace(/\/?$/, '/viewform');
      }

      const result = await chrome.runtime.sendMessage({
        type: 'FETCH_FORM_HTML',
        url: formUrl
      });

      if (!result.success) {
        throw new Error(result.error || '폼 정보를 가져올 수 없습니다');
      }

      const entries = extractEntryIds(result.html);
      const formResponseUrl = formUrl.replace('/viewform', '/formResponse');

      await chrome.storage.sync.set({
        googleFormUrl: formResponseUrl,
        formEntries: entries
      });

      showFormConnected(entries);
      showToast('구글 폼 연결 완료!');
    } catch (error) {
      console.error('[SPARTA] 폼 연결 오류:', error);
      statusEl.textContent = '❌ 연결 실패';
      statusEl.style.color = '#ef4444';
    }
  }

  // 초기화 버튼
  resetBtn.addEventListener('click', async () => {
    if (confirm('모든 진행 상황을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      await chrome.storage.sync.set({ solvedProblems: [] });
      solvedProblems = [];
      updateProgress(solvedProblems);
      showNextProblem(solvedProblems);
      renderAllPlatforms(solvedProblems);
      showToast('초기화 완료');
    }
  });

  // ========== 이벤트 위임 (Event Delegation) ==========

  function initEventDelegation() {
    // 난이도 그룹 클릭 (펼치기/접기)
    document.addEventListener('click', async (e) => {
      // 난이도 헤더 클릭
      const diffHeader = e.target.closest('.difficulty-header');
      if (diffHeader) {
        diffHeader.classList.toggle('expanded');
        const list = diffHeader.nextElementSibling;
        if (list && list.classList.contains('problem-list')) {
          list.classList.toggle('show');
        }
        return;
      }

      // 체크박스 클릭 (완료 상태 토글)
      const checkBox = e.target.closest('.problem-check');
      if (checkBox) {
        e.stopPropagation();
        const problemItem = checkBox.closest('.problem-item');
        const problemId = parseInt(problemItem.dataset.id, 10);
        await toggleSolvedStatus(problemId);
        return;
      }

      // 문제 제목 또는 화살표 클릭
      const problemTitle = e.target.closest('.problem-title');
      const problemGo = e.target.closest('.problem-go');
      if (problemTitle || problemGo) {
        const problemItem = (problemTitle || problemGo).closest('.problem-item');
        const problemId = parseInt(problemItem.dataset.id, 10);
        const problem = PROBLEMS.find(p => p.id === problemId);
        if (problem) {
          const url = getProblemUrl(problem);
          chrome.tabs.create({ url });
        }
        return;
      }
    });
  }

  // 완료 상태 토글 함수
  async function toggleSolvedStatus(problemId) {
    const stored = await chrome.storage.sync.get(['solvedProblems']);
    let currentSolved = stored.solvedProblems || [];

    const index = currentSolved.indexOf(problemId);
    if (index > -1) {
      currentSolved.splice(index, 1);
      showToast('미완료로 변경됨');
    } else {
      currentSolved.push(problemId);
      showToast('완료로 표시됨');
    }

    await chrome.storage.sync.set({ solvedProblems: currentSolved });
    solvedProblems = currentSolved;

    // 펼쳐진 상태 저장
    const expandedGroups = getExpandedGroups();

    // UI 업데이트
    updateProgress(solvedProblems);
    showNextProblem(solvedProblems);
    renderAllPlatforms(solvedProblems);

    // 펼쳐진 상태 복원
    restoreExpandedGroups(expandedGroups);
  }

  // 현재 펼쳐진 난이도 그룹 저장
  function getExpandedGroups() {
    const expanded = [];
    document.querySelectorAll('.difficulty-header.expanded').forEach(header => {
      const group = header.closest('.difficulty-group');
      if (group) {
        const platform = group.dataset.platform;
        const difficulty = group.dataset.difficulty;
        expanded.push(`${platform}-${difficulty}`);
      }
    });
    return expanded;
  }

  // 펼쳐진 상태 복원
  function restoreExpandedGroups(expandedGroups) {
    expandedGroups.forEach(key => {
      const [platform, difficulty] = key.split('-');
      const group = document.querySelector(`.difficulty-group[data-platform="${platform}"][data-difficulty="${difficulty}"]`);
      if (group) {
        const header = group.querySelector('.difficulty-header');
        const list = group.querySelector('.problem-list');
        if (header && list) {
          header.classList.add('expanded');
          list.classList.add('show');
        }
      }
    });
  }

  // ========== 탭 기능 ==========

  function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;

        // 모든 탭 버튼 비활성화
        tabBtns.forEach(b => b.classList.remove('active'));
        // 모든 탭 컨텐츠 숨김
        tabContents.forEach(c => c.classList.remove('active'));

        // 선택한 탭 활성화
        btn.classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');
      });
    });
  }

  // ========== 렌더링 함수 ==========

  function renderAllPlatforms(solved) {
    renderPlatformDifficulties('programmers', 'progDifficultyList', solved);
    renderPlatformDifficulties('leetcode', 'leetDifficultyList', solved);
    renderPlatformDifficulties('hackerrank', 'hackDifficultyList', solved);
  }

  function renderPlatformDifficulties(platform, containerId, solved) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const solvedSet = new Set(solved);
    let html = '';

    // 난이도 1~5에 대해 그룹 생성
    for (let diff = 1; diff <= 5; diff++) {
      const problems = getProblemsByPlatformAndDifficulty(platform, diff);
      if (problems.length === 0) continue;

      const solvedCount = problems.filter(p => solvedSet.has(p.id)).length;
      const percent = Math.round((solvedCount / problems.length) * 100);
      const stars = getDifficultyShort(diff);

      html += `
        <div class="difficulty-group" data-platform="${platform}" data-difficulty="${diff}">
          <div class="difficulty-header">
            <div class="difficulty-label">
              <span class="difficulty-stars">${stars}</span>
              <span class="difficulty-name">${DIFFICULTY_NAMES[diff]}</span>
            </div>
            <div class="difficulty-stats">
              <span class="difficulty-count">${solvedCount}/${problems.length}</span>
              <div class="difficulty-progress">
                <div class="difficulty-progress-fill" style="width: ${percent}%"></div>
              </div>
              <span class="difficulty-arrow">▼</span>
            </div>
          </div>
          <div class="problem-list" id="list-${platform}-${diff}">
            ${renderProblemItems(problems, solvedSet)}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  function renderProblemItems(problems, solvedSet) {
    return problems.map(p => {
      const isSolved = solvedSet.has(p.id);
      return `
        <div class="problem-item ${isSolved ? 'solved' : ''}" data-id="${p.id}">
          <div class="problem-check" title="클릭하여 완료 상태 전환">${isSolved ? '✓' : ''}</div>
          <span class="problem-num">${p.id}</span>
          <span class="problem-title">${p.title}</span>
          <span class="problem-go">→</span>
        </div>
      `;
    }).join('');
  }

  // ========== 진행률 업데이트 ==========

  function updateProgress(solved) {
    const total = PROBLEMS.length;
    const solvedCount = solved.length;
    const percent = Math.round((solvedCount / total) * 100);

    // 헤더 통계
    headerStats.textContent = `${solvedCount}/${total}`;
    totalPercent.textContent = `${percent}%`;

    // 플랫폼별 통계
    const solvedSet = new Set(solved);
    let progSolved = 0, leetSolved = 0, hackSolved = 0;

    PROBLEMS.forEach(p => {
      if (solvedSet.has(p.id)) {
        if (p.platform === 'programmers') progSolved++;
        else if (p.platform === 'leetcode') leetSolved++;
        else if (p.platform === 'hackerrank') hackSolved++;
      }
    });

    progCount.textContent = progSolved;
    leetCount.textContent = leetSolved;
    hackCount.textContent = hackSolved;

    // 탭 카운트
    progTabCount.textContent = `${progSolved}/${PLATFORM_COUNTS.programmers}`;
    leetTabCount.textContent = `${leetSolved}/${PLATFORM_COUNTS.leetcode}`;
    hackTabCount.textContent = `${hackSolved}/${PLATFORM_COUNTS.hackerrank}`;
  }

  // ========== 다음 문제 표시 ==========

  function showNextProblem(solved) {
    const solvedSet = new Set(solved);
    let next = null;

    // 난이도 → 플랫폼 순서로 정렬된 문제 목록에서 풀지 않은 첫 문제 찾기
    const sortedProblems = getSortedProblemsForRecommendation();
    for (const p of sortedProblems) {
      if (!solvedSet.has(p.id)) {
        next = p;
        break;
      }
    }

    currentNextProblem = next;

    if (next) {
      nextProblemContainer.classList.remove('hidden');
      completeContainer.classList.add('hidden');

      nextTitle.textContent = next.title;
      nextDifficulty.textContent = getDifficultyShort(next.difficulty);
      nextPlatform.textContent = PLATFORM_NAMES[next.platform];
    } else {
      nextProblemContainer.classList.add('hidden');
      completeContainer.classList.remove('hidden');
    }
  }

  // ========== 유틸리티 함수 ==========

  function showNameSetup() {
    profileSetup.classList.remove('hidden');
    profileSetup.style.display = 'flex';
    profileDisplay.classList.add('hidden');
    profileDisplay.style.display = 'none';
  }

  function showNameDisplay(name) {
    profileSetup.classList.add('hidden');
    profileSetup.style.display = 'none';
    profileDisplay.classList.remove('hidden');
    profileDisplay.style.display = 'flex';
    currentNameSpan.textContent = name;
  }

  function showFormConnected(entries) {
    // 메인 UI의 폼 설정 섹션 숨기기
    mainFormSetup.classList.add('hidden');

    // 설정 탭의 폼 상태 업데이트
    formSetup.classList.add('hidden');
    formDisplay.classList.remove('hidden');

    // 상세 정보
    const entryCount = Object.keys(entries).length;
    formEntryInfo.textContent = `${entryCount}개 필드 연결됨`;

    // Entry ID 상세 표시
    const entryLabels = {
      name: '이름',
      problem: '문제',
      code: '코드',
      github: 'GitHub',
      dateYear: '날짜(년)',
      dateMonth: '날짜(월)',
      dateDay: '날짜(일)'
    };

    const details = Object.entries(entries)
      .map(([key, val]) => `${entryLabels[key] || key}: ${val}`)
      .join(' | ');

    entryDetails.textContent = details;
  }

  function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.95), rgba(139, 92, 246, 0.95));
      color: white;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      z-index: 9999;
      animation: toastIn 0.3s ease;
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    toast.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // 클립보드 복사 함수
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      const codeCopiedMsg = document.getElementById('codeCopiedMsg');
      if (codeCopiedMsg) {
        codeCopiedMsg.classList.remove('hidden');
        setTimeout(() => codeCopiedMsg.classList.add('hidden'), 2000);
      }
      console.log('[SPARTA] 코드 클립보드 복사 완료:', text);
    } catch (err) {
      console.error('[SPARTA] 클립보드 복사 실패:', err);
    }
  }

  function extractEntryIds(html) {
    const entries = {};
    const fbStartIndex = html.indexOf('FB_PUBLIC_LOAD_DATA_');

    if (fbStartIndex !== -1) {
      try {
        const equalIndex = html.indexOf('=', fbStartIndex);
        const arrayStart = html.indexOf('[', equalIndex);
        let depth = 0;
        let arrayEnd = arrayStart;

        for (let i = arrayStart; i < html.length; i++) {
          if (html[i] === '[') depth++;
          else if (html[i] === ']') depth--;
          if (depth === 0) {
            arrayEnd = i + 1;
            break;
          }
        }

        const data = JSON.parse(html.slice(arrayStart, arrayEnd));
        const fields = data[1]?.[1];

        if (Array.isArray(fields)) {
          fields.forEach(field => {
            if (Array.isArray(field)) {
              const label = field[1] ? String(field[1]).toLowerCase() : '';
              let entryId = field[4]?.[0]?.[0] || field[4]?.[0] || field[3];

              if (entryId) {
                const entryKey = `entry.${entryId}`;
                if (label.includes('진행일자') || label.includes('날짜')) {
                  entries.dateYear = `entry.${entryId}_year`;
                  entries.dateMonth = `entry.${entryId}_month`;
                  entries.dateDay = `entry.${entryId}_day`;
                } else if (label.includes('raw') || label.includes('코드')) {
                  entries.code = entryKey;
                } else if (label.includes('해결') || label.includes('문제')) {
                  entries.problem = entryKey;
                } else if (label.includes('이름')) {
                  entries.name = entryKey;
                } else if (label.includes('github') || label.includes('링크')) {
                  entries.github = entryKey;
                }
              }
            }
          });
        }
      } catch (e) {
        console.error('[SPARTA] Entry ID 추출 실패:', e);
      }
    }

    return entries;
  }

  function getProblemUrl(problem) {
    switch (problem.platform) {
      case 'programmers':
        return `https://school.programmers.co.kr/learn/courses/30/lessons/${problem.problemId}`;
      case 'leetcode':
        return `https://leetcode.com/problems/${problem.problemId}/`;
      case 'hackerrank':
        return `https://www.hackerrank.com/challenges/${problem.problemId}/problem`;
      default:
        return problem.url || '#';
    }
  }

  // ========== GitHub 관련 함수 ==========

  // GitHub 상태 로드 및 초기화 (백그라운드 CHECK_AUTH 사용)
  async function initGitHub() {
    try {
      // 인증 상태 확인 (강화된 검증)
      const authResult = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
      console.log('[SPARTA] 초기 인증 상태:', authResult);

      // user 객체까지 확인하여 완전한 로그인 상태 검증
      if (authResult.success && authResult.authenticated && authResult.user) {
        // 로그인됨
        showGitHubLoggedIn(authResult.user);
        await loadUserReposFromBackground();

        if (authResult.repo) {
          repoSelect.value = authResult.repo;
        }
      } else {
        // 로그인 안됨
        showGitHubLoggedOut();
      }

      // 자동 제출 설정 로드 (로그인 상태와 무관하게 항상 로드)
      const settings = await chrome.storage.sync.get(['githubAutoSubmit']);
      githubAutoSubmit.checked = settings.githubAutoSubmit !== false;
    } catch (error) {
      console.error('[SPARTA] GitHub 초기화 오류:', error);
      showGitHubLoggedOut();
    }
  }

  // GitHub 로그인 UI 상태 전환
  function showGitHubLoggedOut() {
    githubLoginSection.classList.remove('hidden');
    deviceCodeSection.classList.add('hidden');
    githubUserSection.classList.add('hidden');
  }

  function showDeviceCode(code) {
    githubLoginSection.classList.add('hidden');
    deviceCodeSection.classList.remove('hidden');
    githubUserSection.classList.add('hidden');
    userCodeDisplay.textContent = code;
  }

  function showGitHubLoggedIn(user) {
    githubLoginSection.classList.add('hidden');
    deviceCodeSection.classList.add('hidden');
    githubUserSection.classList.remove('hidden');
    githubAvatar.src = user.avatar_url;
    githubName.textContent = user.name || user.login;
    // 만료 메시지 제거
    const expiredMsg = document.getElementById('githubExpiredMsg');
    if (expiredMsg) expiredMsg.remove();
  }

  // GitHub 토큰 만료 메시지 표시
  function showGitHubTokenExpiredMessage() {
    // 기존 메시지 제거
    const existing = document.getElementById('githubExpiredMsg');
    if (existing) existing.remove();

    // 만료 메시지 생성
    const msg = document.createElement('div');
    msg.id = 'githubExpiredMsg';
    msg.style.cssText = `
      color: #f59e0b;
      font-size: 12px;
      margin-top: 8px;
      padding: 8px;
      background: rgba(245, 158, 11, 0.1);
      border-radius: 4px;
      text-align: center;
    `;
    msg.textContent = '⚠️ GitHub 토큰이 만료되었습니다. 다시 로그인해주세요.';

    // 로그인 버튼 아래에 추가
    githubLoginSection.appendChild(msg);

    // 5초 후 자동 제거
    setTimeout(() => {
      if (msg.parentNode) msg.remove();
    }, 5000);
  }

  // 저장소 목록 로드
  async function loadRepos(token) {
    try {
      const repos = await getUserRepos(token);
      repoSelect.innerHTML = '<option value="">저장소 선택...</option>';
      repos.forEach(repo => {
        const option = document.createElement('option');
        option.value = repo.full_name;
        option.textContent = repo.name + (repo.private ? ' 🔒' : '');
        repoSelect.appendChild(option);
      });
    } catch (error) {
      console.error('[SPARTA] 저장소 목록 로드 실패:', error);
    }
  }

  // GitHub 로그인 이벤트 (백그라운드 자동화 버전)
  loginWithGithub.addEventListener('click', async () => {
    // 네트워크 상태 확인
    if (!navigator.onLine) {
      showGitHubTokenExpiredMessage();
      const msg = document.getElementById('githubExpiredMsg');
      if (msg) {
        msg.textContent = '⚠️ 네트워크 연결이 없습니다. 인터넷 연결을 확인해주세요.';
        msg.style.color = '#ef4444';
      }
      return;
    }

    try {
      loginWithGithub.disabled = true;
      loginWithGithub.innerHTML = `
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        연결 중...
      `;

      // Step 1: Device Flow 시작 (백그라운드에 요청)
      const deviceResult = await chrome.runtime.sendMessage({ type: 'START_DEVICE_FLOW' });
      console.log('[SPARTA] Device Flow 결과:', deviceResult);

      if (!deviceResult.success) {
        throw new Error(deviceResult.message || 'Device Flow 시작 실패');
      }

      // Device Code 표시
      showDeviceCode(deviceResult.user_code);

      // 자동으로 코드 클립보드에 복사
      await copyToClipboard(deviceResult.user_code);

      // 자동으로 GitHub 인증 페이지 새 탭에서 열기
      chrome.tabs.create({ url: deviceResult.verification_uri });

      // Step 2: 백그라운드에 폴링 시작 요청 (await 하지 않음!)
      // 팝업이 닫혀도 백그라운드에서 계속 폴링 진행
      chrome.runtime.sendMessage({
        type: 'START_POLLING_BACKGROUND',
        data: {
          device_code: deviceResult.device_code,
          interval: deviceResult.interval,
          expires_in: deviceResult.expires_in
        }
      }).catch(() => {
        // 팝업이 닫혀있어도 무시 - 백그라운드는 계속 진행
        console.log('[SPARTA] 백그라운드에서 폴링 계속 진행');
      });

      // Step 3: 인증 상태 변화 감시 시작
      watchAuthStatusChanges();

    } catch (error) {
      console.error('[SPARTA] GitHub 로그인 오류:', error);
      showToast(error.message || 'GitHub 연결 실패', 'error');
      resetLoginUI();
    }
  });

  // 로그아웃 (완전한 상태 초기화)
  githubLogout.addEventListener('click', async () => {
    if (confirm('GitHub 연결을 해제하시겠습니까?')) {
      try {
        // 진행 중인 인증 폴링 중지
        if (authWatchInterval) {
          clearInterval(authWatchInterval);
          authWatchInterval = null;
        }

        const result = await chrome.runtime.sendMessage({ type: 'LOGOUT' });

        if (result.success) {
          // UI 상태 완전 초기화
          showGitHubLoggedOut();
          resetLoginUI();
          repoSelect.innerHTML = '<option value="">저장소 선택...</option>';
          showToast('로그아웃되었습니다');
        } else {
          showToast('로그아웃 실패: ' + (result.message || '알 수 없는 오류'), 'error');
        }
      } catch (error) {
        console.error('[SPARTA] 로그아웃 오류:', error);
        showToast('로그아웃 실패: ' + error.message, 'error');
      }
    }
  });

  // 저장소 선택 변경
  repoSelect.addEventListener('change', async () => {
    await chrome.storage.sync.set({ githubRepo: repoSelect.value });
    if (repoSelect.value) {
      showToast('저장소가 선택되었습니다');
    }
  });

  // 새 저장소 생성 (고정 이름: sql-codekata)
  createRepoBtn.addEventListener('click', async () => {
    const repoName = 'sql-codekata';

    try {
      createRepoBtn.disabled = true;
      createRepoBtn.textContent = '생성 중...';
      const tokenData = await chrome.storage.local.get(['githubToken']);

      const result = await chrome.runtime.sendMessage({
        type: 'CREATE_GITHUB_REPO',
        data: { repoName: repoName }
      });

      if (result.success) {
        showToast('저장소가 생성되었습니다!');

        const fullName = result.repo.full_name;

        // Optimistic UI Update: 새 저장소를 드롭다운에 즉시 추가
        const existsInSelect = Array.from(repoSelect.options).some(opt => opt.value === fullName);
        if (!existsInSelect) {
          const option = document.createElement('option');
          option.value = fullName;
          option.textContent = repoName;
          if (repoSelect.options.length > 1) {
            repoSelect.insertBefore(option, repoSelect.options[1]);
          } else {
            repoSelect.appendChild(option);
          }
        }

        // 새 저장소 선택
        repoSelect.value = fullName;
        await chrome.storage.sync.set({ githubRepo: fullName });

        // 백그라운드에서 API 목록 새로고침 (동기화 목적)
        setTimeout(async () => {
          await loadRepos(tokenData.githubToken);
          repoSelect.value = fullName;
        }, 2000);
      } else {
        showToast(result.error || '저장소 생성 실패', 'error');
      }
    } catch (error) {
      showToast(error.message || '저장소 생성 실패', 'error');
    } finally {
      createRepoBtn.disabled = false;
      createRepoBtn.textContent = '+ 새 저장소 만들기 (sql-codekata)';
    }
  });

  // 자동 제출 토글
  githubAutoSubmit.addEventListener('change', async () => {
    await chrome.storage.sync.set({ githubAutoSubmit: githubAutoSubmit.checked });
    showToast(githubAutoSubmit.checked ? 'GitHub 자동 제출 활성화' : 'GitHub 자동 제출 비활성화');
  });

  // 복사 버튼 이벤트 리스너
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', async () => {
      const code = userCodeDisplay.textContent;
      if (code && code !== 'XXXX-XXXX') {
        await copyToClipboard(code);
      }
    });
  }
});
