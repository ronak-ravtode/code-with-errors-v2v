import React from 'react';

export default function Background() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#f7f7fa]">
            {/* Using the directly downloaded local video so it plays instantly and flawlessly without hotlink buffering issues */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute w-full h-full object-cover scale-105"
            >
                <source src="/assets/background.mp4" type="video/mp4" />
            </video>

            {/* Just a very subtle dark vignette around the edges to frame the dynamic content cleanly, no blur */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.1)_100%)]"></div>
        </div>
    );
}
