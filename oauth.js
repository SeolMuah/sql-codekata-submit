// GitHub OAuth Device Flow 모듈
// Chrome Extension에서 백엔드 없이 OAuth 인증 구현
// SQL 코드카타용으로 수정됨

// GitHub OAuth App Client ID
const GITHUB_CLIENT_ID = 'Ov23liDBpBLRDTiNHEyy';

// 폴링 중복 실행 방지 플래그
let isPollingForToken = false;

// GitHub Device Flow URLs
const GITHUB_DEVICE_CODE_URL = 'https://github.com/login/device/code';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';
const GITHUB_REPOS_URL = 'https://api.github.com/user/repos';

// 유틸리티: sleep 함수
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 유틸리티: 타임아웃이 있는 fetch 래퍼
async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// 1. Device Code 요청
async function requestDeviceCode() {
  const response = await fetchWithTimeout(GITHUB_DEVICE_CODE_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: 'repo user'
    })
  }, 15000);

  if (!response.ok) {
    throw new Error('Device Code 요청 실패');
  }

  const data = await response.json();
  console.log('[SQL OAuth] Device Code 응답:', data);

  return data;
}

// 2. 토큰 폴링 (사용자가 인증할 때까지 대기)
async function pollForToken(deviceCode, interval = 5, expiresIn = 900) {
  // 이미 폴링 중인 경우 중복 실행 방지
  if (isPollingForToken) {
    console.log('[SQL OAuth] 이미 토큰 폴링 중입니다');
    throw new Error('이미 로그인 진행 중입니다. 잠시 후 다시 시도해주세요.');
  }

  isPollingForToken = true;
  const startTime = Date.now();
  const maxTime = expiresIn * 1000;
  let currentInterval = interval;

  try {
    while (Date.now() - startTime < maxTime) {
      await sleep(currentInterval * 1000);

      try {
        const response = await fetch(GITHUB_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
          })
        });

        const data = await response.json();
        console.log('[SQL OAuth] 토큰 폴링 응답:', data);

        // 성공: 토큰 발급
        if (data.access_token) {
          return {
            success: true,
            access_token: data.access_token,
            token_type: data.token_type,
            scope: data.scope
          };
        }

        // 대기 중
        if (data.error === 'authorization_pending') {
          console.log('[SQL OAuth] 사용자 인증 대기 중...');
          continue;
        }

        // 속도 제한
        if (data.error === 'slow_down') {
          currentInterval += 5;
          console.log('[SQL OAuth] 속도 제한, 간격 증가:', currentInterval);
          continue;
        }

        // 만료
        if (data.error === 'expired_token') {
          throw new Error('인증 시간이 만료되었습니다. 다시 시도해주세요.');
        }

        // 접근 거부
        if (data.error === 'access_denied') {
          throw new Error('사용자가 권한을 거부했습니다.');
        }

        // 기타 오류
        if (data.error) {
          throw new Error(data.error_description || data.error);
        }
      } catch (error) {
        if (error.message.includes('fetch')) {
          console.error('[SQL OAuth] 네트워크 오류:', error);
          continue;
        }
        throw error;
      }
    }

    throw new Error('인증 시간이 초과되었습니다. 다시 시도해주세요.');
  } finally {
    // 폴링 완료 시 플래그 해제
    isPollingForToken = false;
  }
}

// 3. 사용자 정보 가져오기
async function getUserInfo(token) {
  const response = await fetchWithTimeout(GITHUB_USER_URL, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  }, 15000);

  if (!response.ok) {
    throw new Error('사용자 정보 조회 실패');
  }

  const data = await response.json();
  return {
    login: data.login,
    name: data.name || data.login,
    avatar_url: data.avatar_url,
    html_url: data.html_url
  };
}

// 4. 사용자 저장소 목록 가져오기
async function getUserRepos(token) {
  const timestamp = Date.now();
  const response = await fetchWithTimeout(`${GITHUB_REPOS_URL}?per_page=100&sort=updated&_t=${timestamp}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    }
  }, 20000);

  if (!response.ok) {
    throw new Error('저장소 목록 조회 실패');
  }

  const repos = await response.json();
  return repos.map(repo => ({
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    private: repo.private,
    description: repo.description
  }));
}

// 5. 새 저장소 생성 (SQL 코드카타용)
async function createRepo(token, repoName = 'sql-codekata') {
  const response = await fetchWithTimeout(GITHUB_REPOS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: repoName,
      description: 'SPARTA SQL 코드카타 풀이 저장소',
      private: false,
      auto_init: true,
      has_issues: false,
      has_projects: false,
      has_wiki: false
    })
  }, 20000);

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 422 && error.errors?.[0]?.message?.includes('already exists')) {
      throw new Error('이미 같은 이름의 저장소가 존재합니다');
    }
    throw new Error(error.message || '저장소 생성 실패');
  }

  const repo = await response.json();
  return {
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url
  };
}

// 6. 토큰 유효성 검사
async function validateToken(token) {
  try {
    const response = await fetchWithTimeout(GITHUB_USER_URL, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    }, 10000);
    return response.ok;
  } catch {
    return false;
  }
}

// 7. 로그아웃 (토큰 삭제)
async function logout() {
  await chrome.storage.local.remove(['githubToken', 'githubUser']);
  await chrome.storage.sync.remove(['githubRepo']);
  console.log('[SQL OAuth] 로그아웃 완료');
}

// Client ID 유효성 확인
function isClientIdConfigured() {
  return GITHUB_CLIENT_ID && GITHUB_CLIENT_ID !== 'YOUR_CLIENT_ID';
}
