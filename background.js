// Service Worker Imports (반드시 맨 위에 위치)
importScripts('problems.js', 'oauth.js', 'github-api.js');

// Google Form Configuration
// URL과 Entry ID는 chrome.storage.sync에서 동적으로 로드됨 (Google 계정 동기화 지원)
// (설정에서 구글 폼 URL 입력 시 자동 추출되어 저장됨)

// 메시지 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 구글 폼 제출
  if (message.type === 'SUBMIT_TO_GOOGLE_FORM') {
    if (!message.data) {
      sendResponse({ success: false, error: '유효하지 않은 데이터입니다' });
      return true;
    }
    submitToGoogleForm(message.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // 구글 폼 HTML 가져오기 (popup.js에서 요청)
  if (message.type === 'FETCH_FORM_HTML') {
    if (!message.url) {
      sendResponse({ success: false, error: '유효하지 않은 URL입니다' });
      return true;
    }
    fetchFormHtml(message.url)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // GitHub 제출
  if (message.type === 'SUBMIT_TO_GITHUB') {
    if (!message.data) {
      sendResponse({ success: false, error: '유효하지 않은 데이터입니다' });
      return true;
    }
    submitToGitHub(message.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // GitHub 토큰 검증
  if (message.type === 'VALIDATE_GITHUB_TOKEN') {
    validateGitHubToken()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // GitHub 저장소 생성
  if (message.type === 'CREATE_GITHUB_REPO') {
    if (!message.data) {
      sendResponse({ success: false, error: '유효하지 않은 데이터입니다' });
      return true;
    }
    createGitHubRepository(message.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// 구글 폼 HTML 가져오기 (background에서 실행하면 CORS 우회)
async function fetchFormHtml(formUrl) {
  try {
    console.log('[SPARTA] Background에서 폼 HTML 가져오기:', formUrl);
    const response = await fetch(formUrl, {
      credentials: 'omit',  // 쿠키 없이 요청
      redirect: 'follow'    // 리다이렉트 따라가기
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    console.log('[SPARTA] 폼 HTML 길이:', html.length);
    return { success: true, html: html };
  } catch (error) {
    console.error('[SPARTA] 폼 HTML 가져오기 실패:', error);
    return { success: false, error: error.message };
  }
}

// viewform 페이지에서 fbzx 토큰 추출
async function getFbzxToken(formResponseUrl) {
  // formResponse URL을 viewform URL로 변환
  const viewformUrl = formResponseUrl.replace('/formResponse', '/viewform');

  console.log('[SPARTA] fbzx 토큰 가져오기:', viewformUrl);

  const response = await fetch(viewformUrl);
  const html = await response.text();

  // fbzx 값 추출 (hidden input에서)
  const fbzxMatch = html.match(/name="fbzx"\s+value="([^"]+)"/);
  if (fbzxMatch) {
    console.log('[SPARTA] fbzx 토큰 추출 성공:', fbzxMatch[1]);
    return fbzxMatch[1];
  }

  // 대체 패턴 시도
  const fbzxMatch2 = html.match(/"fbzx":"([^"]+)"/);
  if (fbzxMatch2) {
    console.log('[SPARTA] fbzx 토큰 추출 성공 (대체):', fbzxMatch2[1]);
    return fbzxMatch2[1];
  }

  console.log('[SPARTA] fbzx 토큰 추출 실패');
  return null;
}

// 구글 폼 제출
async function submitToGoogleForm(data) {
  try {
    // 저장된 설정 로드 (이름, 폼 URL, Entry IDs)
    const settings = await chrome.storage.sync.get(['studentName', 'googleFormUrl', 'formEntries']);
    const studentName = settings.studentName || '';
    const googleFormUrl = settings.googleFormUrl;
    const formEntries = settings.formEntries;

    if (!studentName) {
      return { success: false, error: '이름을 먼저 설정해주세요' };
    }

    if (!googleFormUrl || !formEntries) {
      return { success: false, error: '구글 폼을 먼저 설정해주세요' };
    }

    // viewform 페이지에서 fbzx 토큰 가져오기
    const fbzx = await getFbzxToken(googleFormUrl);
    if (!fbzx) {
      return { success: false, error: 'fbzx 토큰을 가져올 수 없습니다' };
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // 동적으로 로드된 Entry ID 사용
    const formData = {};

    if (formEntries.name) formData[formEntries.name] = studentName;
    if (formEntries.problem) formData[formEntries.problem] = data.problemTitle || '';
    if (formEntries.code) formData[formEntries.code] = data.code || '';
    if (formEntries.github) formData[formEntries.github] = data.github || '';
    if (formEntries.dateYear) formData[formEntries.dateYear] = year.toString();
    if (formEntries.dateMonth) formData[formEntries.dateMonth] = month.toString();
    if (formEntries.dateDay) formData[formEntries.dateDay] = day.toString();

    // Google Forms 필수 hidden 필드 추가 (실제 fbzx 사용)
    formData['fvv'] = '1';
    formData['partialResponse'] = '[null,null,"' + fbzx + '"]';
    formData['pageHistory'] = '0';
    formData['fbzx'] = fbzx;

    // 수동 인코딩 (Google Apps Script와 동일한 방식)
    const formPayload = Object.keys(formData).map(key =>
      encodeURIComponent(key) + '=' + encodeURIComponent(formData[key])
    ).join('&');

    console.log('[SPARTA] 전송할 URL:', googleFormUrl);
    console.log('[SPARTA] fbzx 토큰:', fbzx);
    console.log('[SPARTA] 제출 데이터:', {
      name: studentName,
      problem: data.problemTitle,
      code: (data.code || '').substring(0, 100) + '...',
      codeLength: (data.code || '').length,
      year: year,
      month: month,
      day: day
    });

    // Chrome extension with host_permissions can make cross-origin requests
    // 15초 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response;
    try {
      response = await fetch(googleFormUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formPayload,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    console.log('[SPARTA] Google Form 전송 완료, status:', response.status);

    // 응답 본문 확인
    const responseText = await response.text();
    console.log('[SPARTA] 응답 길이:', responseText.length);

    // 성공 여부 확인
    if (response.status === 200 && responseText.includes('응답이 기록되었습니다')) {
      console.log('[SPARTA] ✅ 폼 제출 성공!');
      return { success: true };
    } else if (response.status === 400) {
      console.log('[SPARTA] ❌ 폼 제출 실패 - 400 에러');
      return { success: false, error: '폼 제출 실패 (400)' };
    } else {
      console.log('[SPARTA] ⚠️ 응답 상태:', response.status);
      // 200이면 성공으로 처리
      return { success: response.status === 200 };
    }
  } catch (error) {
    console.error('[SPARTA] Google Form 제출 실패:', error);
    return { success: false, error: error.message };
  }
}

// 초기화
chrome.runtime.onInstalled.addListener(() => {
  console.log('[SPARTA] SQL 코드카타 설치됨 (v1.1.0 - GitHub 지원)');
});

// =============================================
// GitHub 관련 함수들
// =============================================

// GitHub로 코드 제출
async function submitToGitHub(data) {
  try {
    const settings = await chrome.storage.sync.get(['githubRepo', 'studentName']);
    const tokenData = await chrome.storage.local.get(['githubToken']);

    if (!tokenData.githubToken) {
      return { success: false, error: 'GitHub 로그인이 필요합니다' };
    }

    if (!settings.githubRepo) {
      return { success: false, error: '저장소를 선택해주세요' };
    }

    const studentName = settings.studentName || '익명';

    // GitHubAPI 인스턴스 생성
    const api = createGitHubAPI(tokenData.githubToken, settings.githubRepo);

    // 문제 정보 및 코드
    const problem = data.problem;
    const code = data.code;

    console.log('[SPARTA GitHub] 제출 시작:', {
      problem: problem.title || problem.problemId,
      platform: problem.platform,
      repo: settings.githubRepo
    });

    // 코드 푸시
    const result = await api.pushSolution(problem, code, studentName);

    if (result.success) {
      console.log('[SPARTA GitHub] ✅ 제출 성공:', result.url);
    } else {
      console.error('[SPARTA GitHub] ❌ 제출 실패:', result.message);
    }

    return result;
  } catch (error) {
    console.error('[SPARTA GitHub] 제출 오류:', error);
    return { success: false, error: error.message };
  }
}

// GitHub 토큰 검증
async function validateGitHubToken() {
  try {
    const tokenData = await chrome.storage.local.get(['githubToken']);

    if (!tokenData.githubToken) {
      return { valid: false, error: '토큰이 없습니다' };
    }

    const isValid = await validateToken(tokenData.githubToken);
    return { valid: isValid };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// GitHub 저장소 생성
async function createGitHubRepository(data) {
  try {
    const tokenData = await chrome.storage.local.get(['githubToken']);

    if (!tokenData.githubToken) {
      return { success: false, error: 'GitHub 로그인이 필요합니다' };
    }

    const repoName = data.repoName || 'sql-codekata';
    const repo = await createRepo(tokenData.githubToken, repoName);

    console.log('[SPARTA GitHub] 저장소 생성 성공:', repo.full_name);
    return { success: true, repo: repo };
  } catch (error) {
    console.error('[SPARTA GitHub] 저장소 생성 실패:', error);
    return { success: false, error: error.message };
  }
}
