import React from 'react'

interface SplitAuthLayoutProps {
  children: React.ReactNode
}

export function SplitAuthLayout({ children }: SplitAuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#d5dce6]">
      {/* BEHIND-CARD BLUE DIAGONAL */}
      <div
        className="absolute inset-0 z-0 hidden lg:block"
        style={{
          background: '#3478F6',
          clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 15% 100%)',
        }}
      />

      {/* FLOATING CARD */}
      <div
        className="relative z-10 w-[90%] max-w-[1080px] bg-white rounded-2xl overflow-hidden mx-4 my-6 lg:my-8 flex flex-col lg:block"
        style={{ minHeight: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
      >
        {/* MOBILE/TABLET ILLUSTRATION BANNER (< lg) */}
        <div
          className="relative w-full lg:hidden overflow-hidden"
          style={{ height: '220px' }}
          aria-hidden="true"
        >
          <div className="absolute inset-0" style={{ background: '#3478F6' }} />
          <img
            src="/illustrations/auth-hero.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-16 z-10"
            style={{
              background: 'white',
              clipPath: 'polygon(0 100%, 100% 60%, 100% 100%, 0% 100%)',
            }}
          />
        </div>

        {/* FORM CONTENT */}
        <div className="lg:w-[42%] flex items-center px-8 py-10 sm:px-12 lg:px-14 min-h-[400px] lg:min-h-[560px] flex-1">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        {/* DESKTOP ILLUSTRATION */}
        <div
          className="hidden lg:block absolute top-0 right-0 bottom-0 w-[60%]"
          aria-hidden="true"
          style={{
            clipPath: 'polygon(18% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}
        >
          <div className="absolute inset-0" style={{ background: '#3478F6' }} />
          <img
            src="/illustrations/auth-hero.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  )
}
