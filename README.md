## 인접한 수의 합이 모두 제곱수인 자연수의 원형 배열 찾기

## Finding Circular Arrangement of Natural Numbers Where Every Pair of Two Adjacent Numbers Sums to a Perfect Square

본 탐구에서는 백트래킹 알고리즘을 이용해 특정 규칙을 만족시키는 수의 배열을 탐색한다. 인접한 수의 합이 모두 제곱수인 1부터 n까지 자연수의 원형 배열을 ‘좋은고리’라 칭한다. JavaScript를 이용해 재귀 호출로 백트래킹 알고리즘을 구현해, n=32 좋은고리부터 n=120 좋은고리까지 발견하였다. 또한 좋은고리 탐색에서 최소 차수 휴리스틱의 사용이 탐색 시간을 10~100배 단축시킴을 밝혔다.

좋은고리 탐색 과정을 Web Worker를 사용하여 계산하고 결과와 과정을 시각화하였다.

URL: https://beautyofmath.moveto.kr

## Getting Started

```bash
pnpm i
pnpm dev
```
