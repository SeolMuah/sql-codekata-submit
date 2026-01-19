// SQL 코드카타 문제 목록 (총 184개) - 실제 난이도(difficulty 1-5) 포함
const PROBLEMS = [
  // 프로그래머스 (1-76)
  { id: 1, difficulty: 1, title: "이름이 있는 동물의 아이디", platform: "programmers", problemId: "59407" },
  { id: 2, difficulty: 1, title: "역순 정렬하기", platform: "programmers", problemId: "59035" },
  { id: 3, difficulty: 1, title: "중복 제거하기", platform: "programmers", problemId: "59408" },
  { id: 4, difficulty: 1, title: "동물의 아이디와 이름", platform: "programmers", problemId: "59403" },
  { id: 5, difficulty: 1, title: "동물 수 구하기", platform: "programmers", problemId: "59406" },
  { id: 6, difficulty: 2, title: "동명 동물 수 찾기", platform: "programmers", problemId: "59041" },
  { id: 7, difficulty: 1, title: "아픈 동물 찾기", platform: "programmers", problemId: "59036" },
  { id: 8, difficulty: 1, title: "상위 n개 레코드", platform: "programmers", problemId: "59405" },
  { id: 9, difficulty: 1, title: "최솟값 구하기", platform: "programmers", problemId: "59038" },
  { id: 10, difficulty: 1, title: "어린 동물 찾기", platform: "programmers", problemId: "59037" },
  { id: 11, difficulty: 1, title: "여러 기준으로 정렬하기", platform: "programmers", problemId: "59404" },
  { id: 12, difficulty: 1, title: "이름에 el이 들어가는 동물 찾기", platform: "programmers", problemId: "59047" },
  { id: 13, difficulty: 1, title: "나이 정보가 없는 회원 수 구하기", platform: "programmers", problemId: "131528" },
  { id: 14, difficulty: 1, title: "가장 비싼 상품 구하기", platform: "programmers", problemId: "131697" },
  { id: 15, difficulty: 1, title: "NULL 처리하기", platform: "programmers", problemId: "59410" },
  { id: 16, difficulty: 1, title: "경기도에 위치한 식품창고 목록 출력하기", platform: "programmers", problemId: "131114" },
  { id: 17, difficulty: 1, title: "강원도에 위치한 생산공장 목록 출력하기", platform: "programmers", problemId: "131112" },
  { id: 18, difficulty: 1, title: "DATETIME에서 DATE로 형 변환", platform: "programmers", problemId: "59414" },
  { id: 19, difficulty: 1, title: "흉부외과 또는 일반외과 의사 목록 출력하기", platform: "programmers", problemId: "132203" },
  { id: 20, difficulty: 1, title: "가격이 제일 비싼 식품의 정보 출력하기", platform: "programmers", problemId: "131115" },
  { id: 21, difficulty: 1, title: "이름이 없는 동물의 아이디", platform: "programmers", problemId: "59039" },
  { id: 22, difficulty: 1, title: "조건에 맞는 회원수 구하기", platform: "programmers", problemId: "131535" },
  { id: 23, difficulty: 3, title: "중성화 여부 파악하기", platform: "programmers", problemId: "59409" },
  { id: 24, difficulty: 2, title: "카테고리 별 상품 개수 구하기", platform: "programmers", problemId: "131529" },
  { id: 25, difficulty: 2, title: "고양이와 개는 몇 마리 있을까", platform: "programmers", problemId: "59040" },
  { id: 26, difficulty: 2, title: "입양 시각 구하기(1)", platform: "programmers", problemId: "59412" },
  { id: 27, difficulty: 2, title: "진료과별 총 예약 횟수 출력하기", platform: "programmers", problemId: "132202" },
  { id: 28, difficulty: 1, title: "12세 이하인 여자 환자 목록 출력하기", platform: "programmers", problemId: "132201" },
  { id: 29, difficulty: 1, title: "인기있는 아이스크림", platform: "programmers", problemId: "133024" },
  { id: 30, difficulty: 2, title: "자동차 종류 별 특정 옵션이 포함된 자동차 수 구하기", platform: "programmers", problemId: "151137" },
  { id: 31, difficulty: 3, title: "오랜 기간 보호한 동물(1)", platform: "programmers", problemId: "59044" },
  { id: 32, difficulty: 2, title: "카테고리 별 도서 판매량 집계하기", platform: "programmers", problemId: "144855" },
  { id: 33, difficulty: 2, title: "상품 별 오프라인 매출 구하기", platform: "programmers", problemId: "131533" },
  { id: 34, difficulty: 2, title: "있었는데요 없었습니다", platform: "programmers", problemId: "59043" },
  { id: 35, difficulty: 2, title: "오랜 기간 보호한 동물(2)", platform: "programmers", problemId: "59411" },
  { id: 36, difficulty: 2, title: "보호소에서 중성화한 동물", platform: "programmers", problemId: "59045" },
  { id: 37, difficulty: 2, title: "조건에 맞는 도서와 저자 리스트 출력하기", platform: "programmers", problemId: "144854" },
  { id: 38, difficulty: 3, title: "조건별로 분류하여 주문상태 출력하기", platform: "programmers", problemId: "131113" },
  { id: 39, difficulty: 2, title: "성분으로 구분한 아이스크림 총 주문량", platform: "programmers", problemId: "133026" },
  { id: 40, difficulty: 1, title: "루시와 엘라 찾기", platform: "programmers", problemId: "59046" },
  { id: 41, difficulty: 1, title: "조건에 맞는 도서 리스트 출력하기", platform: "programmers", problemId: "144853" },
  { id: 42, difficulty: 1, title: "평균 일일 대여 요금 구하기", platform: "programmers", problemId: "151136" },
  { id: 43, difficulty: 3, title: "조건에 맞는 사용자와 총 거래금액 조회하기", platform: "programmers", problemId: "164668" },
  { id: 44, difficulty: 2, title: "가격대 별 상품 개수 구하기", platform: "programmers", problemId: "131530" },
  { id: 45, difficulty: 1, title: "3월에 태어난 여성 회원 목록 출력하기", platform: "programmers", problemId: "131120" },
  { id: 46, difficulty: 2, title: "대여 기록이 존재하는 자동차 리스트 구하기", platform: "programmers", problemId: "157341" },
  { id: 47, difficulty: 1, title: "모든 레코드 조회하기", platform: "programmers", problemId: "59034" },
  { id: 48, difficulty: 3, title: "즐겨찾기가 가장 많은 식당 정보 출력하기", platform: "programmers", problemId: "131123" },
  { id: 49, difficulty: 3, title: "식품분류별 가장 비싼 식품의 정보 조회하기", platform: "programmers", problemId: "131116" },
  { id: 50, difficulty: 3, title: "5월 식품들의 총매출 조회하기", platform: "programmers", problemId: "131117" },
  { id: 51, difficulty: 3, title: "없어진 기록 찾기", platform: "programmers", problemId: "59042" },
  { id: 52, difficulty: 2, title: "과일로 만든 아이스크림 고르기", platform: "programmers", problemId: "133025" },
  { id: 53, difficulty: 2, title: "재구매가 일어난 상품과 회원 리스트 구하기", platform: "programmers", problemId: "131536" },
  { id: 54, difficulty: 1, title: "최댓값 구하기", platform: "programmers", problemId: "59415" },
  { id: 55, difficulty: 3, title: "조건에 맞는 사용자 정보 조회하기", platform: "programmers", problemId: "164670" },
  { id: 56, difficulty: 1, title: "특정 옵션이 포함된 자동차 리스트 구하기", platform: "programmers", problemId: "157343" },
  { id: 57, difficulty: 2, title: "조건에 부합하는 중고거래 상태 조회하기", platform: "programmers", problemId: "164672" },
  { id: 58, difficulty: 3, title: "취소되지 않은 진료 예약 조회하기", platform: "programmers", problemId: "132204" },
  { id: 59, difficulty: 3, title: "자동차 대여 기록에서 대여중 / 대여 가능 여부 구분하기", platform: "programmers", problemId: "157340" },
  { id: 60, difficulty: 3, title: "년, 월, 성별 별 상품 구매 회원 수 구하기", platform: "programmers", problemId: "131532" },
  { id: 61, difficulty: 3, title: "서울에 위치한 식당 목록 출력하기", platform: "programmers", problemId: "131118" },
  { id: 62, difficulty: 3, title: "자동차 대여 기록에서 장기/단기 대여 구분하기", platform: "programmers", problemId: "151138" },
  { id: 63, difficulty: 3, title: "자동차 평균 대여 기간 구하기", platform: "programmers", problemId: "157342" },
  { id: 64, difficulty: 3, title: "헤비 유저가 소유한 장소2021 Dev-Matching: 웹 백엔드 개발자(상반기)", platform: "programmers", problemId: "77487" },
  { id: 65, difficulty: 3, title: "우유와 요거트가 담긴 장바구니Summer/Winter Coding(2019)", platform: "programmers", problemId: "62284" },
  { id: 66, difficulty: 4, title: "조회수가 가장 많은 중고거래 게시판의 첨부파일 조회하기", platform: "programmers", problemId: "164671" },
  { id: 67, difficulty: 3, title: "주문량이 많은 아이스크림들 조회하기", platform: "programmers", problemId: "133027" },
  { id: 68, difficulty: 4, title: "저자 별 카테고리 별 매출액 집계하기", platform: "programmers", problemId: "144856" },
  { id: 69, difficulty: 4, title: "대여 횟수가 많은 자동차들의 월별 대여 횟수 구하기", platform: "programmers", problemId: "151139" },
  { id: 70, difficulty: 4, title: "그룹별 조건에 맞는 식당 목록 출력하기", platform: "programmers", problemId: "131124" },
  { id: 71, difficulty: 3, title: "오프라인/온라인 판매 데이터 통합하기", platform: "programmers", problemId: "131537" },
  { id: 72, difficulty: 2, title: "조건에 부합하는 중고거래 댓글 조회하기", platform: "programmers", problemId: "164673" },
  { id: 73, difficulty: 4, title: "입양 시각 구하기(2)", platform: "programmers", problemId: "59413" },
  { id: 74, difficulty: 5, title: "특정 기간동안 대여 가능한 자동차들의 대여비용 구하기", platform: "programmers", problemId: "157339" },
  { id: 75, difficulty: 5, title: "자동차 대여 기록 별 대여 금액 구하기", platform: "programmers", problemId: "151141" },
  { id: 76, difficulty: 4, title: "상품을 구매한 회원 비율 구하기", platform: "programmers", problemId: "131534" },

  // LeetCode (77-126)
  { id: 77, difficulty: 1, title: "1757. Recyclable and Low Fat Products", platform: "leetcode", problemId: "recyclable-and-low-fat-products" },
  { id: 78, difficulty: 1, title: "584. Find Customer Referee", platform: "leetcode", problemId: "find-customer-referee" },
  { id: 79, difficulty: 1, title: "595. Big Countries", platform: "leetcode", problemId: "big-countries" },
  { id: 80, difficulty: 1, title: "1148. Article Views I", platform: "leetcode", problemId: "article-views-i" },
  { id: 81, difficulty: 1, title: "1683. Invalid Tweets", platform: "leetcode", problemId: "invalid-tweets" },
  { id: 82, difficulty: 2, title: "1378. Replace Employee ID With The Unique Identifier", platform: "leetcode", problemId: "replace-employee-id-with-the-unique-identifier" },
  { id: 83, difficulty: 2, title: "1068. Product Sales Analysis I", platform: "leetcode", problemId: "product-sales-analysis-i" },
  { id: 84, difficulty: 2, title: "1581. Customer Who Visited but Did Not Make Any Transactions", platform: "leetcode", problemId: "customer-who-visited-but-did-not-make-any-transactions" },
  { id: 85, difficulty: 2, title: "197. Rising Temperature", platform: "leetcode", problemId: "rising-temperature" },
  { id: 86, difficulty: 2, title: "1661. Average Time of Process per Machine", platform: "leetcode", problemId: "average-time-of-process-per-machine" },
  { id: 87, difficulty: 2, title: "577. Employee Bonus", platform: "leetcode", problemId: "employee-bonus" },
  { id: 88, difficulty: 3, title: "1280. Students and Examinations", platform: "leetcode", problemId: "students-and-examinations" },
  { id: 89, difficulty: 3, title: "570. Managers with at Least 5 Direct Reports", platform: "leetcode", problemId: "managers-with-at-least-5-direct-reports" },
  { id: 90, difficulty: 3, title: "1934. Confirmation Rate", platform: "leetcode", problemId: "confirmation-rate" },
  { id: 91, difficulty: 1, title: "620. Not Boring Movies", platform: "leetcode", problemId: "not-boring-movies" },
  { id: 92, difficulty: 3, title: "1251. Average Selling Price", platform: "leetcode", problemId: "average-selling-price" },
  { id: 93, difficulty: 2, title: "1075. Project Employees I", platform: "leetcode", problemId: "project-employees-i" },
  { id: 94, difficulty: 2, title: "1633. Percentage of Users Attended a Contest", platform: "leetcode", problemId: "percentage-of-users-attended-a-contest" },
  { id: 95, difficulty: 2, title: "1211. Queries Quality and Percentage", platform: "leetcode", problemId: "queries-quality-and-percentage" },
  { id: 96, difficulty: 2, title: "1193. Monthly Transactions I", platform: "leetcode", problemId: "monthly-transactions-i" },
  { id: 97, difficulty: 4, title: "1174. Immediate Food Delivery II", platform: "leetcode", problemId: "immediate-food-delivery-ii" },
  { id: 98, difficulty: 4, title: "550. Game Play Analysis IV", platform: "leetcode", problemId: "game-play-analysis-iv" },
  { id: 99, difficulty: 2, title: "2356. Number of Unique Subjects Taught by Each Teacher", platform: "leetcode", problemId: "number-of-unique-subjects-taught-by-each-teacher" },
  { id: 100, difficulty: 2, title: "1141. User Activity for the Past 30 Days I", platform: "leetcode", problemId: "user-activity-for-the-past-30-days-i" },
  { id: 101, difficulty: 3, title: "1070. Product Sales Analysis III", platform: "leetcode", problemId: "product-sales-analysis-iii" },
  { id: 102, difficulty: 2, title: "596. Classes More Than 5 Students", platform: "leetcode", problemId: "classes-with-at-least-5-students" },
  { id: 103, difficulty: 2, title: "1729. Find Followers Count", platform: "leetcode", problemId: "find-followers-count" },
  { id: 104, difficulty: 2, title: "619. Biggest Single Number", platform: "leetcode", problemId: "biggest-single-number" },
  { id: 105, difficulty: 3, title: "1045. Customers Who Bought All Products", platform: "leetcode", problemId: "customers-who-bought-all-products" },
  { id: 106, difficulty: 3, title: "1731. The Number of Employees Which Report to Each Employee", platform: "leetcode", problemId: "the-number-of-employees-which-report-to-each-employee" },
  { id: 107, difficulty: 3, title: "1789. Primary Department for Each Employee", platform: "leetcode", problemId: "primary-department-for-each-employee" },
  { id: 108, difficulty: 1, title: "610. Triangle Judgement", platform: "leetcode", problemId: "triangle-judgement" },
  { id: 109, difficulty: 4, title: "180. Consecutive Numbers", platform: "leetcode", problemId: "consecutive-numbers" },
  { id: 110, difficulty: 4, title: "1164. Product Price at a Given Date", platform: "leetcode", problemId: "product-price-at-a-given-date" },
  { id: 111, difficulty: 4, title: "1204. Last Person to Fit in the Bus", platform: "leetcode", problemId: "last-person-to-fit-in-the-bus" },
  { id: 112, difficulty: 3, title: "1907. Count Salary Categories", platform: "leetcode", problemId: "count-salary-categories" },
  { id: 113, difficulty: 3, title: "1978. Employees Whose Manager Left the Company", platform: "leetcode", problemId: "employees-whose-manager-left-the-company" },
  { id: 114, difficulty: 4, title: "626. Exchange Seats", platform: "leetcode", problemId: "exchange-seats" },
  { id: 115, difficulty: 4, title: "1341. Movie Rating", platform: "leetcode", problemId: "movie-rating" },
  { id: 116, difficulty: 5, title: "1321. Restaurant Growth", platform: "leetcode", problemId: "restaurant-growth" },
  { id: 117, difficulty: 4, title: "602. Friend Requests II: Who Has the Most Friends", platform: "leetcode", problemId: "friend-requests-ii-who-has-the-most-friends" },
  { id: 118, difficulty: 4, title: "585. Investments in 2016", platform: "leetcode", problemId: "investments-in-2016" },
  { id: 119, difficulty: 5, title: "185. Department Top Three Salaries", platform: "leetcode", problemId: "department-top-three-salaries" },
  { id: 120, difficulty: 1, title: "1667. Fix Names in a Table", platform: "leetcode", problemId: "fix-names-in-a-table" },
  { id: 121, difficulty: 1, title: "1527. Patients With a Condition", platform: "leetcode", problemId: "patients-with-a-condition" },
  { id: 122, difficulty: 3, title: "196. Delete Duplicate Emails", platform: "leetcode", problemId: "delete-duplicate-emails" },
  { id: 123, difficulty: 3, title: "176. Second Highest Salary", platform: "leetcode", problemId: "second-highest-salary" },
  { id: 124, difficulty: 3, title: "1484. Group Sold Products By The Date", platform: "leetcode", problemId: "group-sold-products-by-the-date" },
  { id: 125, difficulty: 2, title: "1327. List the Products Ordered in a Period", platform: "leetcode", problemId: "list-the-products-ordered-in-a-period" },
  { id: 126, difficulty: 3, title: "1517. Find Users With Valid E-Mails", platform: "leetcode", problemId: "find-users-with-valid-e-mails" },

  // HackerRank (127-184)
  { id: 127, difficulty: 1, title: "Revising the Select Query I", platform: "hackerrank", problemId: "revising-the-select-query" },
  { id: 128, difficulty: 1, title: "Revising the Select Query II", platform: "hackerrank", problemId: "revising-the-select-query-2" },
  { id: 129, difficulty: 1, title: "Select All", platform: "hackerrank", problemId: "select-all-sql" },
  { id: 130, difficulty: 1, title: "Select By ID", platform: "hackerrank", problemId: "select-by-id" },
  { id: 131, difficulty: 1, title: "Japanese Cities' Attributes", platform: "hackerrank", problemId: "japanese-cities-attributes" },
  { id: 132, difficulty: 1, title: "Japanese Cities' Names", platform: "hackerrank", problemId: "japanese-cities-name" },
  { id: 133, difficulty: 1, title: "Weather Observation Station 1", platform: "hackerrank", problemId: "weather-observation-station-1" },
  { id: 134, difficulty: 2, title: "Weather Observation Station 2", platform: "hackerrank", problemId: "weather-observation-station-2" },
  { id: 135, difficulty: 2, title: "Weather Observation Station 3", platform: "hackerrank", problemId: "weather-observation-station-3" },
  { id: 136, difficulty: 2, title: "Weather Observation Station 4", platform: "hackerrank", problemId: "weather-observation-station-4" },
  { id: 137, difficulty: 3, title: "Weather Observation Station 5", platform: "hackerrank", problemId: "weather-observation-station-5" },
  { id: 138, difficulty: 2, title: "Weather Observation Station 6", platform: "hackerrank", problemId: "weather-observation-station-6" },
  { id: 139, difficulty: 2, title: "Weather Observation Station 7", platform: "hackerrank", problemId: "weather-observation-station-7" },
  { id: 140, difficulty: 2, title: "Weather Observation Station 8", platform: "hackerrank", problemId: "weather-observation-station-8" },
  { id: 141, difficulty: 2, title: "Weather Observation Station 9", platform: "hackerrank", problemId: "weather-observation-station-9" },
  { id: 142, difficulty: 2, title: "Weather Observation Station 10", platform: "hackerrank", problemId: "weather-observation-station-10" },
  { id: 143, difficulty: 2, title: "Weather Observation Station 11", platform: "hackerrank", problemId: "weather-observation-station-11" },
  { id: 144, difficulty: 2, title: "Weather Observation Station 12", platform: "hackerrank", problemId: "weather-observation-station-12" },
  { id: 145, difficulty: 2, title: "Higher Than 75 Marks", platform: "hackerrank", problemId: "more-than-75-marks" },
  { id: 146, difficulty: 1, title: "Employee Names", platform: "hackerrank", problemId: "name-of-employees" },
  { id: 147, difficulty: 1, title: "Employee Salaries", platform: "hackerrank", problemId: "salary-of-employees" },
  { id: 148, difficulty: 3, title: "Type of Triangle", platform: "hackerrank", problemId: "what-type-of-triangle" },
  { id: 149, difficulty: 3, title: "The PADS", platform: "hackerrank", problemId: "the-pads" },
  { id: 150, difficulty: 1, title: "Revising Aggregations - The Count Function", platform: "hackerrank", problemId: "revising-aggregations-the-count-function" },
  { id: 151, difficulty: 1, title: "Revising Aggregations - The Sum Function", platform: "hackerrank", problemId: "revising-aggregations-sum" },
  { id: 152, difficulty: 1, title: "Revising Aggregations - Averages", platform: "hackerrank", problemId: "revising-aggregations-the-average-function" },
  { id: 153, difficulty: 1, title: "Average Population", platform: "hackerrank", problemId: "average-population" },
  { id: 154, difficulty: 1, title: "Japan Population", platform: "hackerrank", problemId: "japan-population" },
  { id: 155, difficulty: 1, title: "Population Density Difference", platform: "hackerrank", problemId: "population-density-difference" },
  { id: 156, difficulty: 2, title: "The Blunder", platform: "hackerrank", problemId: "the-blunder" },
  { id: 157, difficulty: 2, title: "Top Earners", platform: "hackerrank", problemId: "earnings-of-employees" },
  { id: 158, difficulty: 2, title: "Weather Observation Station 13", platform: "hackerrank", problemId: "weather-observation-station-13" },
  { id: 159, difficulty: 2, title: "Weather Observation Station 14", platform: "hackerrank", problemId: "weather-observation-station-14" },
  { id: 160, difficulty: 2, title: "Weather Observation Station 15", platform: "hackerrank", problemId: "weather-observation-station-15" },
  { id: 161, difficulty: 2, title: "Weather Observation Station 16", platform: "hackerrank", problemId: "weather-observation-station-16" },
  { id: 162, difficulty: 2, title: "Weather Observation Station 17", platform: "hackerrank", problemId: "weather-observation-station-17" },
  { id: 163, difficulty: 3, title: "Weather Observation Station 18", platform: "hackerrank", problemId: "weather-observation-station-18" },
  { id: 164, difficulty: 3, title: "Weather Observation Station 19", platform: "hackerrank", problemId: "weather-observation-station-19" },
  { id: 165, difficulty: 2, title: "Population Census", platform: "hackerrank", problemId: "asian-population" },
  { id: 166, difficulty: 2, title: "African Cities", platform: "hackerrank", problemId: "african-cities" },
  { id: 167, difficulty: 2, title: "Average Population of Each Continent", platform: "hackerrank", problemId: "average-population-of-each-continent" },
  { id: 168, difficulty: 3, title: "Binary Tree Nodes", platform: "hackerrank", problemId: "binary-search-tree-1" },
  { id: 169, difficulty: 3, title: "New Companies", platform: "hackerrank", problemId: "the-company" },
  { id: 170, difficulty: 3, title: "Weather Observation Station 20", platform: "hackerrank", problemId: "weather-observation-station-20" },
  { id: 171, difficulty: 3, title: "The Report", platform: "hackerrank", problemId: "the-report" },
  { id: 172, difficulty: 4, title: "Top Competitors", platform: "hackerrank", problemId: "full-score" },
  { id: 173, difficulty: 4, title: "Ollivander's Inventory", platform: "hackerrank", problemId: "harry-potter-and-wands" },
  { id: 174, difficulty: 5, title: "Challenges", platform: "hackerrank", problemId: "challenges" },
  { id: 175, difficulty: 4, title: "Contest Leaderboard", platform: "hackerrank", problemId: "contest-leaderboard" },
  { id: 176, difficulty: 5, title: "SQL Project Planning", platform: "hackerrank", problemId: "sql-projects" },
  { id: 177, difficulty: 4, title: "Placements", platform: "hackerrank", problemId: "placements" },
  { id: 178, difficulty: 4, title: "Symmetric Pairs", platform: "hackerrank", problemId: "symmetric-pairs" },
  { id: 179, difficulty: 5, title: "Interviews", platform: "hackerrank", problemId: "interviews" },
  { id: 180, difficulty: 5, title: "15 Days of Learning SQL", platform: "hackerrank", problemId: "15-days-of-learning-sql" },
  { id: 181, difficulty: 4, title: "Draw The Triangle 1", platform: "hackerrank", problemId: "draw-the-triangle-1" },
  { id: 182, difficulty: 4, title: "Draw The Triangle 2", platform: "hackerrank", problemId: "draw-the-triangle-2" },
  { id: 183, difficulty: 5, title: "Print Prime Numbers", platform: "hackerrank", problemId: "print-prime-numbers" },
  { id: 184, difficulty: 4, title: "Occupations", platform: "hackerrank", problemId: "occupations" }
];

// 난이도별 문제 필터링
function getProblemsbyDifficulty(difficulty, platform = null) {
  let filtered = PROBLEMS.filter(p => p.difficulty === difficulty);
  if (platform) {
    filtered = filtered.filter(p => p.platform === platform);
  }
  return filtered;
}

// 플랫폼별 문제 필터링
function getProblemsByPlatform(platform) {
  return PROBLEMS.filter(p => p.platform === platform);
}

// 플랫폼 + 난이도 조합 필터링
function getProblemsByPlatformAndDifficulty(platform, difficulty) {
  return PROBLEMS.filter(p => p.platform === platform && p.difficulty === difficulty);
}

// 문제 ID로 문제 찾기
function findProblemByProblemId(problemId, platform = 'programmers') {
  return PROBLEMS.find(p => p.problemId === problemId && p.platform === platform);
}

// 다음 문제 찾기 (풀지 않은 문제 중 가장 낮은 번호)
function findNextProblem(solvedIds) {
  const solvedSet = new Set(solvedIds);
  return PROBLEMS.find(p => !solvedSet.has(p.id));
}

// 난이도별 진행률 계산
function getDifficultyProgress(solvedIds, difficulty) {
  const difficultyProblems = PROBLEMS.filter(p => p.difficulty === difficulty);
  const solved = difficultyProblems.filter(p => solvedIds.includes(p.id));
  return {
    total: difficultyProblems.length,
    solved: solved.length,
    percent: difficultyProblems.length > 0 ? Math.round((solved.length / difficultyProblems.length) * 100) : 0
  };
}

// 플랫폼+난이도별 진행률 계산
function getPlatformDifficultyProgress(solvedIds, platform, difficulty) {
  const problems = PROBLEMS.filter(p => p.platform === platform && p.difficulty === difficulty);
  const solved = problems.filter(p => solvedIds.includes(p.id));
  return {
    total: problems.length,
    solved: solved.length,
    percent: problems.length > 0 ? Math.round((solved.length / problems.length) * 100) : 0
  };
}

// 플랫폼별 통계
function getPlatformStats() {
  return {
    programmers: PROBLEMS.filter(p => p.platform === 'programmers').length,
    leetcode: PROBLEMS.filter(p => p.platform === 'leetcode').length,
    hackerrank: PROBLEMS.filter(p => p.platform === 'hackerrank').length
  };
}

// 난이도 텍스트 변환
function getDifficultyText(difficulty) {
  const stars = '⭐'.repeat(difficulty);
  return `${stars} (${difficulty}/5)`;
}

// 난이도 짧은 텍스트
function getDifficultyShort(difficulty) {
  return '⭐'.repeat(difficulty);
}

// 추천 순서대로 정렬된 문제 목록 반환
// 순서: 난이도 1 (프로그래머스 → LeetCode → HackerRank) → 난이도 2 → ...
function getSortedProblemsForRecommendation() {
  const platformOrder = { programmers: 0, leetcode: 1, hackerrank: 2 };

  return [...PROBLEMS].sort((a, b) => {
    // 먼저 난이도로 정렬
    if (a.difficulty !== b.difficulty) {
      return a.difficulty - b.difficulty;
    }
    // 같은 난이도면 플랫폼 순서로 정렬
    if (platformOrder[a.platform] !== platformOrder[b.platform]) {
      return platformOrder[a.platform] - platformOrder[b.platform];
    }
    // 같은 플랫폼이면 ID 순서로 정렬
    return a.id - b.id;
  });
}
