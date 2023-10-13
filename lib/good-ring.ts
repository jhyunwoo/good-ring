import { SetterOrUpdater } from "recoil";

export default function goodRing(
  start: number,
  n_Nodes: number,
  squareUpdater: SetterOrUpdater<number[][]>
): number[] | null {
  // 인접행렬(Adjacency Matrix) 및 인접 리스트(Adjacent List) 초기화 (2가지 모두 사용)
  // 인접행렬은 두 노드의 연결 여부를 최대한 빠르게 판단하는 데 사용
  // 인접 리스트는 한 노드에 연결된 다른 노드를 최대한 빠르게 읽어오는 데 사용
  let adjMtrx: number[][] = new Array(n_Nodes + 1)
    .fill(0)
    .map(() => new Array(n_Nodes).fill(0));
  let adjList: number[][] = new Array(n_Nodes + 1).fill(null).map(() => []);

  let squareUpdateData: number[][] = [];

  // 인접행렬/인접 리스트 상에서 두 노드를 이어주는 함수
  function connectNodes(node1: number, node2: number) {
    if (node1 < 0 || node1 > n_Nodes || node2 < 0 || node2 > n_Nodes) {
      console.error("connectNodes: 범위를 벗어난 노드 입력");
      return;
    }

    if (adjMtrx[node1][node2] === 0) {
      adjList[node1].push(node2);
      adjList[node2].push(node1);
      adjMtrx[node1][node2] = 1;
      adjMtrx[node2][node1] = 1;
    }
  }

  // Step 1: 합이 제곱수가 되는 자연수 노드들 연결하기
  function initGraph() {
    // 제곱수 리스트
    const squares = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196];
    const isSquare = (num: number) => {
      for (let i = 0; i < squares.length; i++) {
        if (num === squares[i]) return true;
      }
      return false;
    };

    // 조건을 만족시키는 노드 연결
    for (let i = 1; i <= n_Nodes; i++) {
      for (let j = 1; j <= n_Nodes; j++) {
        if (i === j) continue;
        if (isSquare(i + j)) {
          squareUpdateData.push([i, j]);
          connectNodes(i, j);
        }
      }
    }
    squareUpdater(squareUpdateData);
  }

  // 휴리스틱 함수 (차수가 작은 정점부터 탐색)
  function heuristic(arr: number[]) {
    let l = arr;
    l.sort((a, b) => adjList[a].length - adjList[b].length);
    return l;
  }

  // Step 2: 해밀턴 회로 탐색(백트래킹)
  // circuit: 현재 탐색 중인 경로 n: 현재 탐색 중인 경로의 길이
  // 해밀턴 회로가 존재하면 그 경로를 반환하고, 존재하지 않으면 최종적으로 null 반환
  let cnt = 0;
  function searchHamilton(path: number[]): number[] | null {
    if (cnt % 5_000_000 == 0) console.log("searching... no.", cnt);
    cnt += 1;
    const n = path.length - 1;

    // 모든 자연수를 이어 해밀턴 경로를 완성했을 경우 회로인지 확인
    if (n === n_Nodes - 1) {
      // 경로의 끝점과 시작점이 연결되어 있다면 <=> 회로라면
      if (adjMtrx[path[n]][path[0]] === 1) {
        return path; // 현재 탐색한 해밀턴 회로 반환
      }
      // 회로가 아니라면 null 반환
      else {
        return null;
      }
    }

    // 현재 경로의 끝단에 연결된 그래프 내 모든 노드에 대해:
    let l = heuristic(adjList[path[n]]);
    for (let i = 0; i < adjList[path[n]].length; i++) {
      // 만약 연결된 노드가 이미 경로 안에 포함되지 않았다면 -> 재귀호출로 탐색
      const nextNode = l[i];
      if (!path.includes(nextNode)) {
        const res = searchHamilton(path.concat([nextNode]));

        // 재귀호출을 거쳐 해밀턴회로를 찾았다면 -> 그대로 return
        if (res != null) {
          return res;
        }
      }
    }

    return null;
  }
  initGraph();
  const result = searchHamilton([start]);

  return result;
}
