import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const InteractiveNFT = React.lazy(() => import("./App"));

const Loading = () => {

    const [isLoading, setIsLoading] = React.useState(true);
    const [progress, setProgress] = React.useState(5);

    React.useEffect(() => {
        if (isLoading) {
            const start = Math.floor(Math.random() * 30 + 20);
            setProgress(start);
            setTimeout(() => {
                setProgress(100 - start > 70 ? Math.floor(100 - start / 2) : 90);
            }, 500);
            setTimeout(() => {
                setIsLoading(false);
            }, 1500);
        }
    }, [isLoading]);

    return (
        <div className="flex flex-col items-center justify-center absolute top-0 left-0 h-full w-full z-[1] bg-[#]">
            <img className="w-[200px]" src="/images/logo.gif" alt="logo" />
            <div className="w-[200px] h-[6px] rounded-full bg-transparent border-bg-main mt-4 overflow-hidden">
                <div
                    className="h-full rounded-full bg-accent"
                    style={{
                        transition: "width 300ms ease-in",
                        width: `${progress}%`,
                    }}
                />
            </div>
        </div>
    );
};

root.render(
  <React.StrictMode>
      <BrowserRouter>
          <React.Suspense fallback={<Loading />}>
          <Routes>
              <Route path=":dna" element={<InteractiveNFT />} />
              <Route element={<Loading />} />
          </Routes>
          </React.Suspense>
      </BrowserRouter>
  </React.StrictMode>
);

