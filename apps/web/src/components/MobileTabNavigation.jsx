import React from 'react';

const MobileTabNavigation = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden sm:block bg-white border-b border-gray-200 sticky top-[73px] z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors btn-touch ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {tab.icon && <tab.icon className="h-4 w-4" />}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation - Bottom Tab Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className={`grid ${tabs.length <= 3 ? 'grid-cols-3' : tabs.length === 4 ? 'grid-cols-4' : 'grid-cols-5'} gap-0.5`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 text-xs font-medium btn-touch transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50 border-t-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 active:bg-gray-50 border-t-2 border-transparent'
              }`}
            >
              <div className="relative">
                {tab.icon && <tab.icon className="h-5 w-5 mb-1" />}
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-bold animate-pulse">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[55px] leading-tight">{tab.shortLabel || tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Content Padding */}
      <div className="sm:hidden h-20" /> {/* Spacer for fixed bottom nav */}
    </>
  );
};

export default MobileTabNavigation;