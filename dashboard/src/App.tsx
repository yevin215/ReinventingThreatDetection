export default function App() {
  return (
    <div className="size-full bg-gray-50 p-8">
      <div className="h-full border-4 border-black rounded-lg p-6 flex gap-6">
        {/* Left Panel - Camera view */}
        <div className="flex-none w-[35%]">
          <div className="h-full border-2 border-black rounded-lg bg-white flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div>Camera</div>
              <div>view</div>
            </div>
          </div>
        </div>

        {/* Right Section - Metrics and AI explanation */}
        <div className="flex-1 flex flex-col gap-6 relative">
          <div className="border-2 border-black rounded-lg bg-white p-6 flex-1 relative">
            <div className="h-full flex flex-col gap-4">
              {/* Top Row - Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="border-2 border-black rounded-lg p-6 bg-white min-h-[120px] flex flex-col justify-end">
                  <div className="text-gray-600">threat rate:</div>
                  <div className="text-gray-600 mt-1">threat color</div>
                </div>
                <div className="border-2 border-black rounded-lg p-6 bg-white min-h-[120px] flex flex-col justify-end">
                  <div className="text-gray-600">heart rate</div>
                </div>
                <div className="border-2 border-black rounded-lg p-6 bg-white min-h-[120px] flex flex-col justify-end">
                  <div className="text-gray-600">Nervousness</div>
                </div>
              </div>

              {/* Middle Row - Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="border-2 border-black rounded-lg p-6 bg-white min-h-[120px] flex flex-col justify-end">
                  <div className="text-gray-600">stress index</div>
                </div>
                <div className="border-2 border-black rounded-lg p-6 bg-white min-h-[120px] flex flex-col justify-end">
                  <div className="text-gray-600">Engagement</div>
                  <div className="text-gray-600">score</div>
                </div>
                <div className="border-2 border-black rounded-lg p-6 bg-white min-h-[120px] flex flex-col justify-end">
                  <div className="text-gray-600">voice alert static</div>
                </div>
              </div>

              {/* Bottom - AI Explanation */}
              <div className="flex-1 border-2 border-black rounded-lg p-4 bg-white">
                <div className="text-gray-600">AI explanation:</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
