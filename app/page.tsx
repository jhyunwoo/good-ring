"use client";

import { addLine } from "@/lib/line-handler";
import { useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

type Inputs = {
  nValue: number;
};

interface UpdateType {
  same: number[];
  diff: number[];
}

export default function Home() {
  const [n, setN] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<number[]>([]);
  const [essential, setEssential] = useState<number[][]>([]);
  const [showResult, setShowResult] = useState<UpdateType[]>([]);
  const [colored, setColored] = useState<number[]>([]);
  const circles: number[] = [];
  const [turn, setTurn] = useState<number>(0);
  const [squareData, setSquareData] = useState<number[][]>([]);
  const [page, setPage] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringWrapper = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker>();

  // React Hook Form 설정
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  /** 입력값 받아서 N값으로 저장 */
  const onSubmit: SubmitHandler<Inputs> = (data: any) => {
    setN(Number(data.nValue));
  };

  // 노드를 원형으로 그리기 위한 각도 계산
  for (let i = 0; i < n; i++) {
    const angle = (i * 360) / n;
    circles.push(angle);
  }

  /** worker에 파일 업로드 명령 */
  function handleWorker(start: number, n_Nodes: number) {
    setLoading(true);
    workerRef.current?.postMessage({ start: start, n_Nodes: n_Nodes });
  }

  /** 두 노드를 연결하는 선을 그리는 함수 */
  function linkNodes(
    canvas: HTMLCanvasElement | null,
    x: number,
    y: number,
    color?: string
  ) {
    if (!ringWrapper.current || !canvas) return;
    addLine(
      canvas,
      ringWrapper.current.children[x]?.getBoundingClientRect().left + 16,
      ringWrapper.current.children[x]?.getBoundingClientRect().top + 16,
      ringWrapper.current.children[y]?.getBoundingClientRect().left + 16,
      ringWrapper.current.children[y]?.getBoundingClientRect().top + 16,
      color
    );
  }

  /** Canvas 모든 선 삭제 */
  function clearCanvas() {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /** 입력된 밀리세컨드 만큼 시간 지연 */
  function delay(ms = 100) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** 두 배열이 같은지 판별 */
  const equals = (a: number[], b: number[]) =>
    JSON.stringify(a) === JSON.stringify(b);

  /** 연결하면 제곱수가 되는 수를 연결하는 함수 */
  function linkSquaredNodes(
    canvas: HTMLCanvasElement | null,
    squares: number[][]
  ) {
    if (!ringWrapper.current || !canvas) return;
    for (let i = 0; i < squares.length; i += 1) {
      linkNodes(canvas, squares[i][0] - 1, squares[i][1] - 1);
    }
  }

  useEffect(() => {
    // n 값을 설정하지 않았다면 실행하지 않음
    if (n === 0) return;

    // 배열 계산용 Worker 생성
    workerRef.current = new Worker(new URL("worker/index.ts", import.meta.url));
    // Worker가 메세지를 받으면 실행할 함수 설정
    workerRef.current.onmessage = (event: MessageEvent<any>) => {
      /** Worker로부터 받은 데이터 */
      const message = event.data;
      /** 연결한 제곱수에 대한 데이터를 받으면 실행 */
      if (message?.squareData) {
        const canvas = canvasRef.current;
        linkSquaredNodes(canvas, message.squareData);
        setSquareData(message.squareData);
      }
      /** 실행 결과에 대한 데이터를 받으면 실행 */
      if (message?.result) {
        setLoading(false);
        /** 범위 오류로 찾을 수 없을 경우 알림창 띄움 */
        if (message.result === "Can't Find Array") {
          alert("해당 범위의 수열을 찾을 수 없습니다.");
        }
        // 받을 결과를 result state에 저장
        setResult(message.result);
      }
      // 실행 결과를 보여주는 경과 데이터를 받으면 essential state에 저장
      if (message?.searchResult) {
        setEssential(message.searchResult);
      }
    };
    // 사용자에게 받은 n 값을 바탕으로 worker을 사용하여 배열 계산
    handleWorker(1, n);

    // Canvas 크기 설정
    canvasRef?.current?.setAttribute("width", `${window.innerWidth}`);
    canvasRef?.current?.setAttribute("height", `${window.innerHeight}`);

    // 모든 계산 종료 후 worker 삭제
    return () => {
      workerRef.current?.terminate();
    };
  }, [n]);

  useEffect(() => {
    // 실행 결과를 받아오지 않았다면 실행하지 않음
    if (essential.length === 0 || page !== 2) return;

    let updateDate: UpdateType[] = [];
    // 이전 결과와 현재 결과와의 경로 차이와 같은 경로를 찾아 updateDate state에 저장
    for (let i = 0; i < essential.length; i += 1) {
      let same: number[] = [];
      let diff: number[] = [];
      const prev = essential[i - 1] || [];
      for (let j = 0; j < prev.length; j += 1) {
        if (equals(essential[i].slice(0, j), prev.slice(0, j))) {
          same = prev.slice(0, j);
          diff = essential[i].slice(j);
        }
      }
      if (prev.length === 0) {
        diff = essential[i];
      }
      if (diff.length !== 0) {
        updateDate.push({ same: same, diff: diff });
      }
    }

    setShowResult(updateDate);
  }, [essential, page]);

  useEffect(() => {
    async function renderResult() {
      // 이전 경로와 다른 노드만 색칠하는 방식으로 애니메이션 효과 구현
      for (let i = 0; i < showResult[turn]?.diff?.length; i += 1) {
        // page 값을 3으로 변경하여 다음 페이지로 넘어갈 겅우 기존 애니메이션 종료
        if (page === 3) break;
        // 0.1초마다 색칠
        await delay(100);
        // 기존과 다른 노드를 색칠할 목록에 하나씩 추가
        setColored((prev) => [...prev, showResult[turn].diff[i]]);
        if (
          showResult[turn].diff[i - 1] &&
          ringWrapper.current &&
          canvasRef.current
        ) {
          linkNodes(
            canvasRef.current,
            showResult[turn].diff[i - 1] - 1,
            showResult[turn].diff[i] - 1,
            "red"
          );
        }
      }

      // 한 턴이 끝난 후 다음 턴에 새로 노드를 색칠하기 위해 canvas를 초기화 하고 제곱수를 다시 연결
      if (showResult?.[turn + 1]?.same) {
        // 색칠되어 있는 노드를 다음 turn의 same 값으로 설정
        setColored([...showResult?.[turn + 1]?.same]);
        // canvas 초기화
        clearCanvas();
        // 제곱수 연결
        linkSquaredNodes(canvasRef.current, squareData);
        // 다음 turn의 경로와 현재 경로의 같은 노트를 미리 색칠
        for (let i = 0; i < showResult[turn + 1]?.same?.length; i += 1) {
          if (
            canvasRef.current &&
            ringWrapper.current &&
            showResult[turn + 1].same[i + 1]
          ) {
            linkNodes(
              canvasRef.current,
              showResult[turn + 1].same[i] - 1,
              showResult[turn + 1].same[i + 1] - 1,
              "red"
            );
          }
        }
      } else {
        // 경로 찾기 종료
        console.log("finish", turn);
        // page를 3으로 설정
        if (showResult.length > 0) {
          setPage(3);
        }
        // 마지막 최종 결과를 색칠
        for (let i = 0; i < result.length; i += 1) {
          await delay(100);
          setColored((prev) => [...prev, result[i]]);
          if (result[i - 1] && ringWrapper.current && canvasRef.current) {
            linkNodes(
              canvasRef.current,
              result[i - 1] - 1,
              result[i] - 1,
              "red"
            );
          }
        }
        // 마지막 배열의 값과 첫 번째 배열의 값을 연결
        if (result[0] && ringWrapper.current && canvasRef.current) {
          linkNodes(canvasRef.current, result[0] - 1, result.length - 1, "red");
        }
      }
    }

    if (page !== 3) {
      renderResult();
    } else {
      // canvas 초기화
      clearCanvas();
      // 제곱수 연결
      linkSquaredNodes(canvasRef.current, squareData);
      // 마지막 최종 결과를 색칠
      for (let i = 0; i < result.length; i += 1) {
        setColored((prev) => [...prev, result[i]]);
        if (result[i - 1] && ringWrapper.current && canvasRef.current) {
          linkNodes(canvasRef.current, result[i - 1] - 1, result[i] - 1, "red");
        }
      }
      // 마지막 배열의 값과 첫 번째 배열의 값을 연결
      if (result[0] && ringWrapper.current && canvasRef.current) {
        linkNodes(canvasRef.current, result[0] - 1, result.length - 1, "red");
      }
    }
  }, [showResult, turn, page]);

  useEffect(() => {
    /**
     *  colored 값이 변경될 때 마다
     *  colored 값과 showResult에 있는 다음 turn의 same 값이 같은지 비교 후
     *  같을 경우 다음 turn으로 자동으로 넘어가게 설정
     */
    if (
      showResult.length !== 0 &&
      JSON.stringify(colored) === JSON.stringify(showResult[turn + 1]?.same)
    ) {
      setTurn((prev) => prev + 1);
    }
  }, [colored]);

  return (
    <div className="w-full h-screen flex justify-center items-center text-white">
      {loading && (
        <div className="w-full h-screen fixed top-0 flex flex-col justify-center items-center bg-slate-900/80 touch-none z-20">
          <div className="text-xl font-semibold p-2">수열을 찾는중...</div>
          <Cog6ToothIcon className="w-12 h-12 animate-spin text-slate-300" />
        </div>
      )}
      {n === 0 && (
        <div className="fixed top-0 w-full h-screen flex justify-center items-center bg-slate-950 z-20 p-4">
          <div className="flex flex-col justify-center items-center w-full max-w-xl">
            <h1 className="text-xl font-bold p-4">
              수열의 범위를 입력해주세요. (1~100)
            </h1>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col w-full space-y-2 items-center justify-center"
            >
              <input
                className="p-2 rounded-md bg-slate-800 ring-2 ring-white text-center w-full max-w-sm"
                type="number"
                {...register("nValue", {
                  required: { value: true, message: "범위를 입력하세요." },
                  min: { value: 1, message: "1 이상의 수를 입력하세요." },
                  max: { value: 100, message: "100 이하의 수를 입력하세요." },
                })}
              />

              {errors.nValue && (
                <span className="text-red-500">{errors.nValue.message}</span>
              )}

              <button
                type="submit"
                className="bg-green-600 text-white p-2 rounded-md px-4 max-w-sm w-full"
              >
                확인
              </button>
            </form>
          </div>
        </div>
      )}
      <div
        ref={ringWrapper}
        className="w-2/3 h-screen flex justify-center items-center bg-slate-900/50"
      >
        {circles.map((angle, i) => (
          <div
            key={i}
            id={`a${i + 1}`}
            style={{
              transform: `rotate(${angle}deg) translate(350px) rotate(-${angle}deg)`,
            }}
            className={`flex justify-center items-center text-white w-8 h-8 absolute  rounded-full ${
              colored.includes(i + 1) ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div className="w-1/3 h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        {page === 1 && (
          <>
            <h1 className="text-lg font-semibold mb-4">
              1. 두 수의 합이 제곱수인 모든 수를 연결합니다.{" "}
            </h1>
            <button
              onClick={() => setPage(2)}
              className="bg-green-600 text-white p-2 px-4 rounded-md hover:bg-green-700 transition duration-200 text-lg"
            >
              다음 단계
            </button>
          </>
        )}
        {page === 2 && (
          <>
            <h1 className="text-lg font-semibold mb-4">
              2-1. 인접행렬은 두 노드의 연결 여부를 최대한 빠르게 판단하는 데
              사용하고 인접 리스트는 한 노드에 연결된 다른 노드를 최대한 빠르게
              읽어오는 데 사용합니다.
              <br />
              <br /> 2-2. 해밀턴 경로 찾기를 활용하여 수열을 찾습니다.
            </h1>

            <button
              onClick={() => setPage(3)}
              className="bg-green-600 text-white p-2 px-4 rounded-md hover:bg-green-700 transition duration-200 text-lg"
            >
              건너뛰기
            </button>
          </>
        )}
        {page === 3 && (
          <>
            <div className="break-all text-lg font-semibold mb-4">
              결과 : {String(result)}
            </div>
            <a
              href="/"
              className="bg-green-600 text-white p-2 px-4 rounded-md hover:bg-green-700 transition duration-200 text-lg"
            >
              다시하기
            </a>
          </>
        )}
      </div>
      <canvas
        className="fixed top-0 w-full h-screen -z-10 bg-slate-900"
        ref={canvasRef}
      ></canvas>
    </div>
  );
}
