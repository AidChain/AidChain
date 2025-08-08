

export default function RecipientContent() {
  const username = "Test User"

  return (
      <div className="flex flex-col pt-8 pb-8 pr-8 h-full w-full gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-white text-3xl sm:text-4xl font-semibold">Welcome back, 
          <span className="text-transparent bg-gradient-to-r from-teal-200 to-blue-500 bg-clip-text"> {username}</span>
          .</h2>
          <p className="text-md sm:text-lg text-slate-300">
            Your transparent donation platform dashboard.
          </p>
        </div>
        <div className="flex flex-row gap-8 h-full w-full">
          <div className="flex flex-2 flex-col bg-red-400 h-inherit">
            
          </div>
          <div className="flex flex-3 flex-col bg-blue-400 h-inherit"></div>
        </div>
      </div>
  );
};