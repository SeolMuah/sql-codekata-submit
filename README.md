# SQL 코드카타 자동 제출 익스텐션

SPARTA SQL 코드카타 문제 풀이를 자동으로 구글 폼과 GitHub에 제출하는 Chrome 확장 프로그램입니다.

## 지원 플랫폼

- **Programmers** (프로그래머스)
- **LeetCode**
- **HackerRank**

## 설치 방법

1. 이 저장소를 다운로드합니다
   ```
   git clone https://github.com/SeolMuah/sql-codekata-submit-.git
   ```

2. Chrome 브라우저에서 `chrome://extensions` 로 이동합니다

3. 우측 상단의 **개발자 모드**를 켭니다

4. **압축해제된 확장 프로그램을 로드합니다** 버튼을 클릭합니다

5. 다운로드한 폴더를 선택합니다

## 초기 설정

1. 확장 프로그램 아이콘을 클릭합니다

2. **이름**을 입력하고 저장합니다

3. **구글 폼 URL**을 설정합니다 (튜터에게 받은 URL)

4. (선택) **GitHub 연결**로 코드 자동 백업을 설정합니다

## 사용 방법

1. 지원되는 플랫폼에서 SQL 문제를 풉니다

2. **정답 제출** 버튼을 클릭합니다

3. 정답이면 자동으로 구글 폼에 제출됩니다

4. GitHub 연동 시 코드가 자동으로 저장소에 업로드됩니다

## 파일 구조

```
sql_extension_/
├── manifest.json          # 확장 프로그램 설정
├── background.js          # 백그라운드 서비스
├── popup.html/js          # 팝업 UI
├── content.js             # Programmers 스크립트
├── content-leetcode.js    # LeetCode 스크립트
├── content-hackerrank.js  # HackerRank 스크립트
├── problems.js            # 문제 데이터
├── oauth.js               # GitHub OAuth
├── github-api.js          # GitHub API
└── icons/                 # 아이콘
```

## 문의

문제가 있으면 튜터에게 문의해주세요.
