export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Title */}
        <h1 className="text-5xl font-bold text-gray-900 mb-6 text-center">
          Challenges App Discovery
        </h1>
        {/* Main Description Card */}
        <div className="bg-white rounded-xl p-8 shadow-md text-center mb-16">
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Transform your community with engaging challenges that drive member participation and retention.
          </p>
          <p className="text-base text-gray-500 max-w-2xl mx-auto mb-2">
            Create custom challenges, track progress, and reward winners. Perfect for fitness communities, 
            educational groups, and professional development programs.
          </p>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            💡 <strong>Tip:</strong> Install this app to unlock powerful community engagement features 
            that keep your members active and connected.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-xl p-6 shadow-md flex flex-col gap-2">
            <h3 className="font-semibold text-gray-900">
              📈 Boost Engagement
            </h3>
            <p className="text-sm text-gray-600">
              Create challenges that motivate members to participate daily and interact with your community.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md flex flex-col gap-2">
            <h3 className="font-semibold text-gray-900">
              🏆 Reward Systems
            </h3>
            <p className="text-sm text-gray-600">
              Built-in winner selection and progress tracking to celebrate member achievements.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md flex flex-col gap-2">
            <h3 className="font-semibold text-gray-900">
              🎯 Custom Rules
            </h3>
            <p className="text-sm text-gray-600">
              Flexible challenge types with custom durations, entry requirements, and participation rules.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md flex flex-col gap-2">
            <h3 className="font-semibold text-gray-900">
              📊 Analytics
            </h3>
            <p className="text-sm text-gray-600">
              Track participation rates, member engagement, and challenge performance to optimize your community.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Success Stories
        </h2>

        {/* Success Story Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Success Story Card 1 */}
          <div className="bg-white rounded-xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                FitPro Community
              </h3>
              <p className="text-xs text-gray-500 mb-2">Fitness & Wellness</p>
              <p className="text-gray-700 mb-4 text-sm">
                "Member engagement increased by{" "}
                <span className="font-bold text-blue-600">240%</span> after introducing 
                weekly fitness challenges. Daily active users jumped from 50 to{" "}
                <span className="font-bold text-blue-600">170</span>!"
              </p>
            </div>
            <a
              href={`https://whop.com/fitpro/?a=${process.env.NEXT_PUBLIC_WHOP_APP_ID}`}
              className="mt-auto block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center text-sm"
            >
              Visit FitPro Community
            </a>
          </div>

          {/* Success Story Card 2 */}
          <div className="bg-white rounded-xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                TradingMasters
              </h3>
              <p className="text-xs text-gray-500 mb-2">Trading Education</p>
              <p className="text-gray-700 mb-4 text-sm">
                "Retention rate improved to{" "}
                <span className="font-bold text-blue-600">85%</span> with monthly trading 
                challenges. Members love competing and learning from each other!"
              </p>
            </div>
            <a
              href={`https://whop.com/tradingmasters/?a=${process.env.NEXT_PUBLIC_WHOP_APP_ID}`}
              className="mt-auto block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center text-sm"
            >
              Visit TradingMasters
            </a>
          </div>
        </div>

        {/* Installation CTA */}
        <div className="mt-16 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Community?
            </h3>
            <p className="text-gray-600 mb-6">
              Install Challenges App today and start creating engaging experiences for your members.
            </p>
            {process.env.NEXT_PUBLIC_WHOP_APP_ID ? (
              <a
                href={`https://whop.com/apps/${process.env.NEXT_PUBLIC_WHOP_APP_ID}/install`}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Install Challenges App
              </a>
            ) : (
              <p className="text-amber-600">
                App ID not configured for installation link
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
