// "use client";
// import { ConnectButton } from "thirdweb/react";
// import { client } from "@/app/client";
// import Link from "next/link";
// import { useState } from "react";
// import { usePathname } from "next/navigation";

// export default function Navbar() {
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const pathname = usePathname();

//   const navLinks = [
//     { label: "Campaigns", href: "/" },
//     { label: "Start a Campaign", href: "/create" },
//      { label: "Analytics", href: "/analytics" },
//   ];

//   return (
//     <>
//       <nav style={{
//         borderBottom: "1px solid var(--border)",
//         background: "rgba(8,8,15,0.90)",
//         backdropFilter: "blur(20px)",
//         WebkitBackdropFilter: "blur(20px)",
//         position: "sticky",
//         top: 0,
//         zIndex: 100,
//       }}>
//         <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

//           {/* Logo */}
//           <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
//             <div style={{
//               width: 36, height: 36,
//               background: "linear-gradient(135deg, #f97316, #ea580c)",
//               borderRadius: 10,
//               display: "flex", alignItems: "center", justifyContent: "center",
//               boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
//             }}>
//               <svg width="20" height="20" viewBox="0 0 24 24">
//                 <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
//               </svg>
//             </div>
//             <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 21, color: "var(--text)", letterSpacing: "-0.03em" }}>
//               Fund<span style={{ color: "var(--accent)" }}>Chain</span>
//             </span>
//           </Link>

//           {/* Desktop nav */}
//           <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 4 }}>
//             {navLinks.map((link) => (
//               <Link key={link.href} href={link.href} style={{
//                 textDecoration: "none",
//                 padding: "8px 16px",
//                 borderRadius: 10,
//                 fontSize: 14,
//                 fontWeight: 500,
//                 color: pathname === link.href ? "var(--accent)" : "var(--text2)",
//                 background: pathname === link.href ? "var(--accent-glow)" : "transparent",
//                 transition: "all 0.2s",
//                 border: pathname === link.href ? "1px solid rgba(249,115,22,0.2)" : "1px solid transparent",
//               }}
//               onMouseEnter={e => { if (pathname !== link.href) e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface2)"; }}
//               onMouseLeave={e => { e.currentTarget.style.color = pathname === link.href ? "var(--accent)" : "var(--text2)"; e.currentTarget.style.background = pathname === link.href ? "var(--accent-glow)" : "transparent"; }}
//               >
//                 {link.label}
//               </Link>
//             ))}
//           </div>

//           {/* Right side */}
//           <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//             <ConnectButton
//               client={client}
//               connectButton={{
//                 label: "Connect Wallet",
//                 style: {
//                   background: "linear-gradient(135deg, #f97316, #ea580c)",
//                   color: "white",
//                   fontFamily: "'Syne', sans-serif",
//                   fontWeight: 700,
//                   fontSize: 14,
//                   borderRadius: 10,
//                   padding: "10px 20px",
//                   border: "none",
//                   cursor: "pointer",
//                   boxShadow: "0 4px 14px rgba(249,115,22,0.3)",
//                 },
//               }}
//             />
//             {/* Mobile menu button */}
//             <button
//               onClick={() => setMobileOpen(!mobileOpen)}
//               style={{ display: "none", background: "none", border: "1px solid var(--border2)", borderRadius: 8, padding: "8px", cursor: "pointer", color: "var(--text)" }}
//               className="mobile-menu-btn"
//             >
//               {mobileOpen ? "✕" : "☰"}
//             </button>
//           </div>
//         </div>

//         {/* Mobile menu */}
//         {mobileOpen && (
//           <div style={{
//             borderTop: "1px solid var(--border)",
//             background: "var(--surface)",
//             padding: "16px 24px 20px",
//           }}>
//             {navLinks.map((link) => (
//               <Link key={link.href} href={link.href}
//                 onClick={() => setMobileOpen(false)}
//                 style={{
//                   display: "block",
//                   textDecoration: "none",
//                   padding: "12px 0",
//                   fontSize: 16,
//                   fontWeight: 600,
//                   color: pathname === link.href ? "var(--accent)" : "var(--text2)",
//                   borderBottom: "1px solid var(--border)",
//                   fontFamily: "'Syne', sans-serif",
//                 }}>
//                 {link.label}
//               </Link>
//             ))}
//           </div>
//         )}
//       </nav>

//       <style>{`
//         @media (max-width: 768px) {
//           .hide-mobile { display: none !important; }
//           .mobile-menu-btn { display: flex !important; }
//         }
//       `}</style>
//     </>
//   );
// }

"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton, darkTheme } from "thirdweb/react";
import { client } from "@/app/client";
import { sepolia } from "thirdweb/chains";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Campaigns" },
    { href: "/create", label: "Start a Campaign" },
    { href: "/analytics", label: "Analytics" },
  ];

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: "rgba(8,8,15,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          height: 64,
        }}
      >
        <div
          className="container navbar-container"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 24px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white"
                  strokeWidth="2.2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 21,
                color: "var(--text)",
                letterSpacing: "-0.03em",
              }}
            >
              Fund<span style={{ color: "var(--accent)" }}>Chain</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div
            className="navbar-links"
            style={{ display: "flex", gap: 4, alignItems: "center" }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                  color:
                    pathname === link.href ? "var(--accent)" : "var(--text2)",
                  background:
                    pathname === link.href
                      ? "var(--accent-glow)"
                      : "transparent",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Desktop wallet button */}
            <div className="navbar-links">
              <ConnectButton
                client={client}
                chain={sepolia}
                theme={darkTheme({
                  colors: {
                    primaryButtonBg: "#f97316",
                    primaryButtonText: "#ffffff",
                  },
                })}
                connectButton={{ label: "Connect Wallet" }}
                detailsButton={{ style: { borderRadius: 12 } }}
              />
            </div>

            {/* Mobile hamburger */}
            <button
              className="navbar-mobile-menu"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              style={{
                display: "none",
                flexDirection: "column",
                gap: 5,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 6,
              }}
            >
              <span
                style={{
                  display: "block",
                  width: 22,
                  height: 2,
                  background: "var(--text)",
                  borderRadius: 2,
                  transition: "all 0.3s",
                  transform: menuOpen
                    ? "translateY(7px) rotate(45deg)"
                    : "none",
                }}
              />
              <span
                style={{
                  display: "block",
                  width: 22,
                  height: 2,
                  background: "var(--text)",
                  borderRadius: 2,
                  transition: "all 0.3s",
                  opacity: menuOpen ? 0 : 1,
                }}
              />
              <span
                style={{
                  display: "block",
                  width: 22,
                  height: 2,
                  background: "var(--text)",
                  borderRadius: 2,
                  transition: "all 0.3s",
                  transform: menuOpen
                    ? "translateY(-7px) rotate(-45deg)"
                    : "none",
                }}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 64,
            left: 0,
            right: 0,
            zIndex: 999,
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                color:
                  pathname === link.href ? "var(--accent)" : "var(--text2)",
                background:
                  pathname === link.href ? "var(--accent-glow)" : "transparent",
                textDecoration: "none",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                fontSize: 16,
                display: "block",
                transition: "all 0.2s",
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Wallet connect in mobile menu */}
          <div
            style={{
              paddingTop: 12,
              borderTop: "1px solid var(--border)",
              marginTop: 8,
            }}
          >
            <ConnectButton
              client={client}
              chain={sepolia}
              theme={darkTheme({
                colors: {
                  primaryButtonBg: "#f97316",
                  primaryButtonText: "#ffffff",
                },
              })}
              connectButton={{
                label: "Connect Wallet",
                style: { width: "100%" },
              }}
            />
          </div>
        </div>
      )}

      {/* Backdrop */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 998,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}
    </>
  );
}
