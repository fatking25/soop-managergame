import React from "react";

export default function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="burger" aria-hidden />
        <div className="logo">SOOP</div>
      </div>

      <div className="topbar-center">
        <div className="search">
          <span className="search-icon" aria-hidden>⌕</span>
          <div className="search-placeholder">검색</div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="icon">💬</div>
        <div className="icon">🔔</div>
        <div className="avatar-mini" />
        <div className="grid">⋯</div>
      </div>
    </div>
  );
}
