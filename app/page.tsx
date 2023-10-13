"use client";

import { addLine } from "@/lib/line-handler";
import { useRouter } from "next/navigation";
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
  const [page, setPage] = useState<number>(0);
  const [squareData, setSquareData] = useState<number[][]>([]);
  const [second, setSecond] = useState<boolean>(false);
  const [skip, setSkip] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringWrapper = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker>();
  const searchWorkerRef = useRef<Worker>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = (data) => {
    setN(Number(data.nValue));
  };

  const router = useRouter();

  for (let i = 0; i < n; i++) {
    const angle = (i * 360) / n;
    circles.push(angle);
  }

  /** worker에 파일 업로드 명령 */
  function handleWorker(start: number, n_Nodes: number) {
    setLoading(true);
    workerRef.current?.postMessage({ start: start, n_Nodes: n_Nodes });
  }

  function linkSquaredNodes(
    canvas: HTMLCanvasElement | null,
    squares: number[][]
  ) {
    if (!ringWrapper.current || !canvas) return;
    for (let i = 0; i < squares.length; i += 1) {
      addLine(
        canvas,
        ringWrapper.current.children[squares[i][0] - 1]?.getBoundingClientRect()
          .left + 16,
        ringWrapper.current.children[squares[i][0] - 1]?.getBoundingClientRect()
          .top + 16,
        ringWrapper.current.children[squares[i][1] - 1]?.getBoundingClientRect()
          .left + 16,
        ringWrapper.current.children[squares[i][1] - 1]?.getBoundingClientRect()
          .top + 16
      );
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function delay(ms = 100) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const equals = (a: number[], b: number[]) =>
    JSON.stringify(a) === JSON.stringify(b);

  useEffect(() => {
    if (n === 0) return;

    workerRef.current = new Worker(new URL("worker/index.ts", import.meta.url));
    workerRef.current.onmessage = (event: MessageEvent<any>) => {
      const message = event.data;
      if (message?.squareData) {
        const canvas = canvasRef.current;
        linkSquaredNodes(canvas, message.squareData);
        setSquareData(message.squareData);
      }
      if (message?.result) {
        setLoading(false);

        if (message.result === "Can't Find Array") {
          alert("해당 범위의 수열을 찾을 수 없습니다.");
        }
        setResult(message.result);
      }
      if (message?.searchResult) {
        searchWorkerRef.current = new Worker(
          new URL("worker/show-search-result.ts", import.meta.url)
        );
        searchWorkerRef.current.onmessage = (event: MessageEvent<any>) => {
          const message = event.data;
          setEssential(message.essentialList);
        };
        searchWorkerRef.current.postMessage({
          searchResult: message.searchResult,
        });
      }
    };
    handleWorker(1, n);
    // Canvas 크기 설정
    canvasRef?.current?.setAttribute("width", `${window.innerWidth}`);
    canvasRef?.current?.setAttribute("height", `${window.innerHeight}`);

    return () => {
      workerRef.current?.terminate();
      searchWorkerRef.current?.terminate();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useEffect(() => {
    if (essential.length === 0 || !second) return;
    let updateDate: UpdateType[] = [];
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
  }, [essential, second]);

  useEffect(() => {
    async function renderResult() {
      if (showResult[page]) {
        for (let i = 0; i < showResult[page]?.diff?.length; i += 1) {
          if (skip) break;
          await delay(100);
          setColored((prev) => [...prev, showResult[page].diff[i]]);
          if (
            showResult[page].diff[i - 1] &&
            ringWrapper.current &&
            canvasRef.current
          ) {
            addLine(
              canvasRef.current,
              ringWrapper.current.children[
                showResult[page].diff[i - 1] - 1
              ]?.getBoundingClientRect().left + 16,
              ringWrapper.current.children[
                showResult[page].diff[i - 1] - 1
              ]?.getBoundingClientRect().top + 16,
              ringWrapper.current.children[
                showResult[page].diff[i] - 1
              ]?.getBoundingClientRect().left + 16,
              ringWrapper.current.children[
                showResult[page].diff[i] - 1
              ]?.getBoundingClientRect().top + 16,
              "red"
            );
          }
        }
      } else {
        for (let i = 0; i < result.length; i += 1) {
          await delay(100);
          setColored((prev) => [...prev, result[i]]);
          if (result[i - 1] && ringWrapper.current && canvasRef.current) {
            addLine(
              canvasRef.current,
              ringWrapper.current.children[
                result[i - 1] - 1
              ].getBoundingClientRect().left + 16,
              ringWrapper.current.children[
                result[i - 1] - 1
              ].getBoundingClientRect().top + 16,
              ringWrapper.current.children[
                result[i] - 1
              ].getBoundingClientRect().left + 16,
              ringWrapper.current.children[
                result[i] - 1
              ].getBoundingClientRect().top + 16,
              "red"
            );
          }
        }
        if (result[0] && ringWrapper.current && canvasRef.current) {
          addLine(
            canvasRef.current,
            ringWrapper.current.children[result[0] - 1].getBoundingClientRect()
              .left + 16,
            ringWrapper.current.children[result[0] - 1].getBoundingClientRect()
              .top + 16,
            ringWrapper.current.children[
              result[result.length - 1] - 1
            ].getBoundingClientRect().left + 16,
            ringWrapper.current.children[
              result[result.length - 1] - 1
            ].getBoundingClientRect().top + 16,
            "red"
          );
        }
      }

      try {
        setColored([...showResult?.[page + 1]?.same]);
      } catch (e) {
        console.log(e);
      }
      clearCanvas();
      linkSquaredNodes(canvasRef.current, squareData);

      for (let i = 0; i < showResult[page + 1]?.same?.length; i += 1) {
        if (
          canvasRef.current &&
          ringWrapper.current &&
          showResult[page + 1].same[i + 1]
        ) {
          addLine(
            canvasRef.current,
            ringWrapper.current.children[
              showResult[page + 1].same[i] - 1
            ].getBoundingClientRect().left + 16,
            ringWrapper.current.children[
              showResult[page + 1].same[i] - 1
            ].getBoundingClientRect().top + 16,
            ringWrapper.current.children[
              showResult[page + 1].same[i + 1] - 1
            ].getBoundingClientRect().left + 16,
            ringWrapper.current.children[
              showResult[page + 1].same[i + 1] - 1
            ].getBoundingClientRect().top + 16,
            "red"
          );
        }
      }
    }

    renderResult();
  }, [showResult, page, skip]);

  useEffect(() => {
    if (
      showResult.length !== 0 &&
      JSON.stringify(colored) === JSON.stringify(showResult[page + 1]?.same)
    ) {
      setPage((prev) => prev + 1);
    }
  }, [colored]);

  useEffect(() => {
    async function skipAnimation() {
      clearCanvas();
      linkSquaredNodes(canvasRef.current, squareData);
      for (let i = 0; i < result.length; i += 1) {
        await delay(100);
        setColored((prev) => [...prev, result[i]]);
        if (result[i - 1] && ringWrapper.current && canvasRef.current) {
          addLine(
            canvasRef.current,
            ringWrapper.current.children[
              result[i - 1] - 1
            ]?.getBoundingClientRect().left + 16,
            ringWrapper.current.children[
              result[i - 1] - 1
            ]?.getBoundingClientRect().top + 16,
            ringWrapper.current.children[result[i] - 1]?.getBoundingClientRect()
              .left + 16,
            ringWrapper.current.children[result[i] - 1]?.getBoundingClientRect()
              .top + 16,
            "red"
          );
        }
      }
      if (result[0] && ringWrapper.current && canvasRef.current) {
        addLine(
          canvasRef.current,
          ringWrapper.current.children[result[0] - 1]?.getBoundingClientRect()
            .left + 16,
          ringWrapper.current.children[result[0] - 1]?.getBoundingClientRect()
            .top + 16,
          ringWrapper.current.children[
            result[result.length - 1] - 1
          ]?.getBoundingClientRect().left + 16,
          ringWrapper.current.children[
            result[result.length - 1] - 1
          ]?.getBoundingClientRect().top + 16,
          "red"
        );
      }
    }
    skipAnimation();
  }, [skip]);

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
              수열의 범위를 입력해주세요. (1~50)
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
                  max: { value: 50, message: "50 이하의 수를 입력하세요." },
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
              transform: `rotate(${angle}deg) translate(270px) rotate(-${angle}deg)`,
            }}
            className={`flex justify-center items-center text-white w-8 h-8 absolute  rounded-full ${
              colored.includes(i + 1) ? "bg-red-600" : "bg-green-700"
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div className="w-1/3 h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        {!second ? (
          <h1 className="text-lg font-semibold mb-4">
            1. 두 수의 합이 제곱수인 모든 수를 연결합니다.
          </h1>
        ) : skip || page === showResult.length - 1 ? (
          <div className="break-all text-lg font-semibold mb-4">
            결과 : {String(result)}
          </div>
        ) : (
          <h1 className="text-lg font-semibold mb-4">
            2-1. 인접행렬은 두 노드의 연결 여부를 최대한 빠르게 판단하는 데
            사용하고 인접 리스트는 한 노드에 연결된 다른 노드를 최대한 빠르게
            읽어오는 데 사용합니다.
            <br />
            <br /> 2-2. 해킬턴 경로 찾기를 활용하여 수열을 찾습니다.
          </h1>
        )}

        {!second ? (
          <button
            onClick={() => setSecond(true)}
            className="bg-green-600 text-white p-2 px-4 rounded-md hover:bg-green-700 transition duration-200 text-lg"
          >
            다음 단계
          </button>
        ) : skip || page === showResult.length - 1 ? (
          <a
            href="/"
            className="bg-green-600 text-white p-2 px-4 rounded-md hover:bg-green-700 transition duration-200 text-lg"
          >
            다시하기
          </a>
        ) : (
          <button
            onClick={() => setSkip(true)}
            className="bg-green-600 text-white p-2 px-4 rounded-md hover:bg-green-700 transition duration-200 text-lg"
          >
            건너뛰기
          </button>
        )}
      </div>
      <canvas
        className="fixed top-0 w-full h-screen -z-10 bg-slate-900"
        ref={canvasRef}
      ></canvas>
    </div>
  );
}
