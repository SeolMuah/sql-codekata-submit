// GitHub API 모듈 - SQL 코드카타 Chrome Extension
// GitHub REST API를 사용하여 SQL 파일 생성/업데이트 (OAuth 토큰 지원)

// 난이도 정보
const DIFFICULTY_INFO = {
  1: { name: '입문', label: '⭐' },
  2: { name: '기초', label: '⭐⭐' },
  3: { name: '중급', label: '⭐⭐⭐' },
  4: { name: '고급', label: '⭐⭐⭐⭐' },
  5: { name: '심화', label: '⭐⭐⭐⭐⭐' }
};

// 플랫폼 이름
const PLATFORM_NAMES = {
  programmers: '프로그래머스',
  leetcode: 'LeetCode',
  hackerrank: 'HackerRank'
};

// 난이도 폴더명
const DIFFICULTY_FOLDERS = {
  1: '1_입문',
  2: '2_기초',
  3: '3_중급',
  4: '4_고급',
  5: '5_심화'
};

class GitHubAPI {
  constructor(token, owner, repo) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
    this.baseUrl = 'https://api.github.com';
  }

  // API 요청 헤더
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
  }

  // 저장소 존재 여부 확인
  async checkRepo() {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (response.status === 200) {
        return { success: true, message: '저장소 연결 성공' };
      } else if (response.status === 404) {
        return { success: false, message: '저장소를 찾을 수 없습니다' };
      } else if (response.status === 401) {
        return { success: false, message: '인증이 만료되었습니다. 다시 로그인해주세요' };
      } else {
        const data = await response.json();
        return { success: false, message: data.message || '저장소 확인 실패' };
      }
    } catch (error) {
      return { success: false, message: `네트워크 오류: ${error.message}` };
    }
  }

  // 파일 SHA 조회 (업데이트 시 필요)
  async getFileSha(path) {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (response.status === 200) {
        const data = await response.json();
        return { exists: true, sha: data.sha };
      } else if (response.status === 404) {
        return { exists: false, sha: null };
      } else {
        return { exists: false, sha: null, error: '파일 조회 실패' };
      }
    } catch (error) {
      return { exists: false, sha: null, error: error.message };
    }
  }

  // Base64 인코딩
  encodeContent(content) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
  }

  // 파일 생성 또는 업데이트
  async createOrUpdateFile(path, content, message) {
    try {
      // 기존 파일 SHA 확인
      const fileInfo = await this.getFileSha(path);

      const body = {
        message: message,
        content: this.encodeContent(content)
      };

      // 파일이 이미 존재하면 SHA 추가 (업데이트)
      if (fileInfo.exists && fileInfo.sha) {
        body.sha = fileInfo.sha;
      }

      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(body)
        }
      );

      if (response.status === 200 || response.status === 201) {
        const data = await response.json();
        return {
          success: true,
          message: fileInfo.exists ? '파일 업데이트 완료' : '파일 생성 완료',
          url: data.content.html_url
        };
      } else if (response.status === 401) {
        return { success: false, message: '인증이 만료되었습니다. 다시 로그인해주세요' };
      } else if (response.status === 404) {
        return { success: false, message: '저장소를 찾을 수 없습니다' };
      } else if (response.status === 422) {
        return { success: false, message: '파일 경로가 유효하지 않습니다' };
      } else {
        const data = await response.json();
        return { success: false, message: data.message || 'GitHub 업로드 실패' };
      }
    } catch (error) {
      return { success: false, message: `네트워크 오류: ${error.message}` };
    }
  }

  // SQL 코드카타 문제 풀이 코드 업로드
  async pushSolution(problem, code, studentName) {
    const path = getGitHubPath(problem);

    // 파일 헤더 주석 추가
    const header = this.generateFileHeader(problem, studentName);
    const fullContent = header + code;

    // 커밋 메시지 생성
    const platformName = PLATFORM_NAMES[problem.platform] || problem.platform;
    const diffInfo = DIFFICULTY_INFO[problem.difficulty];

    let message;
    if (problem.id && diffInfo) {
      message = `[${platformName}] ${diffInfo.name} - ${problem.title} (#${problem.id})`;
    } else {
      // 미등록 문제
      message = `[${platformName}] other - ${problem.title || problem.problemId}`;
    }

    return await this.createOrUpdateFile(path, fullContent, message);
  }

  // SQL 파일 헤더 생성 (-- 주석 사용)
  generateFileHeader(problem, studentName) {
    const platformName = PLATFORM_NAMES[problem.platform] || problem.platform;
    const url = getProblemUrl(problem);

    // 날짜와 시간 포맷 (한국 시간)
    const now = new Date();
    const dateTime = now.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // 난이도 정보
    let difficultyLine = '';
    if (problem.difficulty && DIFFICULTY_INFO[problem.difficulty]) {
      const diffInfo = DIFFICULTY_INFO[problem.difficulty];
      difficultyLine = `-- ${platformName} ${diffInfo.name} (${diffInfo.label})\n`;
    } else {
      difficultyLine = `-- ${platformName} (미등록 문제)\n`;
    }

    return `-- ${problem.title || problem.problemId}
${difficultyLine}-- 문제 링크: ${url}
-- 작성자: ${studentName}
-- 작성일: ${dateTime}

`;
  }
}

// API 인스턴스 생성 헬퍼
function createGitHubAPI(token, repoPath) {
  const [owner, repo] = repoPath.split('/');
  if (!owner || !repo) {
    throw new Error('저장소 경로가 올바르지 않습니다 (형식: owner/repo)');
  }
  return new GitHubAPI(token, owner, repo);
}

// GitHub 파일 경로 생성
function getGitHubPath(problem) {
  const platform = problem.platform || 'other';

  // 미등록 문제 (id가 없거나 difficulty가 없는 경우)
  if (!problem.id || !problem.difficulty) {
    const fileName = sanitizeFileName(problem.problemId || problem.title || 'unknown');
    return `${platform}/other/${fileName}.sql`;
  }

  // 등록된 문제
  const folder = DIFFICULTY_FOLDERS[problem.difficulty] || 'other';
  const safeTitle = sanitizeFileName(problem.title);

  return `${platform}/${folder}/${problem.id}_${safeTitle}.sql`;
}

// 파일명 안전하게 변환
function sanitizeFileName(name) {
  if (!name) return 'unknown';
  return name
    .replace(/[<>:"/\\|?*]/g, '_')  // 파일명에 사용할 수 없는 문자 제거
    .replace(/\s+/g, '_')           // 공백을 언더스코어로
    .replace(/_+/g, '_')            // 연속 언더스코어 제거
    .replace(/^_|_$/g, '');         // 앞뒤 언더스코어 제거
}

// 문제 URL 생성
function getProblemUrl(problem) {
  switch (problem.platform) {
    case 'programmers':
      return `https://school.programmers.co.kr/learn/courses/30/lessons/${problem.problemId}`;
    case 'leetcode':
      return `https://leetcode.com/problems/${problem.problemId}/`;
    case 'hackerrank':
      return `https://www.hackerrank.com/challenges/${problem.problemId}/problem`;
    default:
      return problem.url || 'URL 없음';
  }
}
