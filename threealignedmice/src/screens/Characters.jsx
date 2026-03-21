/* ─── Shared Skin / Palette helpers ─────────────────────────────────────────── */
const SKIN = '#f5c9a0'
const SKIN_DARK = '#e8b070'
const SKIN_SHADOW = '#d4905a'

/* ─── TELLER (waist-up, behind counter) ─────────────────────────────────────── */
export function TellerPortrait({ active }) {
  return (
    <svg
      className={`char-svg teller-svg ${active ? 'char-active' : 'char-inactive'}`}
      viewBox="0 0 200 290"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Counter front */}
      <rect x="0" y="240" width="200" height="50" fill="#8b5520" />
      <rect x="0" y="234" width="200" height="10" fill="#c8904a" rx="1" />
      {/* Counter grain lines */}
      <line x1="30"  y1="244" x2="30"  y2="290" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />
      <line x1="70"  y1="244" x2="70"  y2="290" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />
      <line x1="110" y1="244" x2="110" y2="290" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />
      <line x1="150" y1="244" x2="150" y2="290" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />

      {/* Shirt body */}
      <path d="M 58 188 Q 50 192 42 210 L 30 244 L 170 244 L 158 210 Q 150 192 142 188 Q 118 180 100 180 Q 82 180 58 188 Z" fill="#f2f2f2" />
      {/* Shirt collar lines */}
      <path d="M 100 180 L 88 205" stroke="#ddd" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 100 180 L 112 205" stroke="#ddd" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Red suspenders */}
      <path d="M 90 182 Q 78 210 72 244" stroke="#8b1a1a" strokeWidth="6" fill="none" />
      <path d="M 110 182 Q 122 210 128 244" stroke="#8b1a1a" strokeWidth="6" fill="none" />
      {/* Horizontal suspender cross */}
      <line x1="82" y1="214" x2="118" y2="214" stroke="#8b1a1a" strokeWidth="5" />
      {/* Bow tie */}
      <polygon points="92,183 100,191 108,183 100,175" fill="#8b1a1a" />
      {/* Bow tie knot */}
      <circle cx="100" cy="182" r="4" fill="#a02020" />

      {/* Left arm (rolled sleeve) */}
      <path d="M 42 210 Q 22 222 18 244 L 50 244 Q 52 228 62 218 Z" fill="#f2f2f2" />
      {/* Red arm garter */}
      <path d="M 22 232 Q 38 228 54 232" stroke="#8b1a1a" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Left hand */}
      <ellipse cx="20" cy="248" rx="13" ry="9" fill={SKIN} />

      {/* Right arm */}
      <path d="M 158 210 Q 178 222 182 244 L 150 244 Q 148 228 138 218 Z" fill="#f2f2f2" />
      <path d="M 178 232 Q 162 228 146 232" stroke="#8b1a1a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="180" cy="248" rx="13" ry="9" fill={SKIN} />

      {/* Neck */}
      <path d="M 88 168 Q 88 182 100 184 Q 112 182 112 168 L 108 158 Q 100 162 92 158 Z" fill={SKIN} />

      {/* Head */}
      <ellipse cx="100" cy="130" rx="42" ry="46" fill={SKIN} />
      {/* Ear left */}
      <ellipse cx="58" cy="132" rx="9" ry="13" fill={SKIN_DARK} />
      <ellipse cx="59" cy="132" rx="5" ry="9" fill={SKIN_SHADOW} />
      {/* Ear right */}
      <ellipse cx="142" cy="132" rx="9" ry="13" fill={SKIN_DARK} />
      <ellipse cx="141" cy="132" rx="5" ry="9" fill={SKIN_SHADOW} />

      {/* Hair */}
      <ellipse cx="100" cy="90" rx="42" ry="20" fill="#5a3010" />
      <path d="M 58 100 Q 60 80 100 76 Q 140 80 142 100" fill="#5a3010" />

      {/* Visor (green eyeshade) */}
      <ellipse cx="100" cy="100" rx="52" ry="16" fill="#1a7a1a" />
      <ellipse cx="100" cy="98" rx="48" ry="13" fill="#239023" />
      {/* Visor highlight */}
      <ellipse cx="82" cy="98" rx="20" ry="5" fill="rgba(255,255,255,0.18)" />
      {/* Visor band */}
      <rect x="52" y="97" width="96" height="7" rx="3.5" fill="#0f5a0f" />

      {/* Glasses */}
      <circle cx="84" cy="124" r="13" fill="rgba(200,220,255,0.15)" stroke="#8b6030" strokeWidth="2.5" />
      <circle cx="116" cy="124" r="13" fill="rgba(200,220,255,0.15)" stroke="#8b6030" strokeWidth="2.5" />
      <line x1="97" y1="124" x2="103" y2="124" stroke="#8b6030" strokeWidth="2.5" />
      <line x1="71" y1="124" x2="62" y2="122" stroke="#8b6030" strokeWidth="2" />
      <line x1="129" y1="124" x2="138" y2="122" stroke="#8b6030" strokeWidth="2" />

      {/* Eyes */}
      <circle cx="84" cy="124" r="5" fill="#3a2010" />
      <circle cx="116" cy="124" r="5" fill="#3a2010" />
      <circle cx="85.5" cy="122.5" r="1.8" fill="white" />
      <circle cx="117.5" cy="122.5" r="1.8" fill="white" />

      {/* Nose */}
      <path d="M 96 135 Q 100 142 104 135" stroke={SKIN_SHADOW} strokeWidth="2" fill="none" />

      {/* Mustache */}
      <path d="M 82 148 Q 91 154 100 151 Q 109 154 118 148" fill="#5a3010" />
      {/* Smile */}
      <path d="M 88 158 Q 100 164 112 158" stroke="#c88060" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/* ─── Shared face helper ────────────────────────────────────────────────────── */
function Face({ cx = 100, cy = 130, mustache = false, feminine = false }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx="36" ry="40" fill={SKIN} />
      <ellipse cx={cx - 36} cy={cy} rx="8" ry="11" fill={SKIN_DARK} />
      <ellipse cx={cx + 36} cy={cy} rx="8" ry="11" fill={SKIN_DARK} />
      {/* Eyes */}
      <circle cx={cx - 14} cy={cy - 4} r={feminine ? 5.5 : 5} fill="#3a2010" />
      <circle cx={cx + 14} cy={cy - 4} r={feminine ? 5.5 : 5} fill="#3a2010" />
      <circle cx={cx - 12.5} cy={cy - 5.5} r="1.8" fill="white" />
      <circle cx={cx + 15.5} cy={cy - 5.5} r="1.8" fill="white" />
      {/* Eyebrows */}
      <path d={`M ${cx-20} ${cy-14} Q ${cx-14} ${cy-18} ${cx-8} ${cy-14}`} stroke="#5a3010" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d={`M ${cx+8} ${cy-14} Q ${cx+14} ${cy-18} ${cx+20} ${cy-14}`} stroke="#5a3010" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <path d={`M ${cx-4} ${cy+8} Q ${cx} ${cy+14} ${cx+4} ${cx-86}`} stroke={SKIN_SHADOW} strokeWidth="1.8" fill="none" />
      <ellipse cx={cx} cy={cy+8} rx="4" ry="3" fill={SKIN_SHADOW} />
      {/* Mustache */}
      {mustache && <path d={`M ${cx-14} ${cy+18} Q ${cx-6} ${cy+22} ${cx} ${cy+20} Q ${cx+6} ${cy+22} ${cx+14} ${cy+18}`} fill="#5a3010" />}
      {/* Mouth */}
      <path d={`M ${cx-10} ${cy+25} Q ${cx} ${cy+30} ${cx+10} ${cy+25}`} stroke="#c88060" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  )
}

/* ─── Body helper (full standing) ──────────────────────────────────────────── */
function StandingBody({ shirtColor = '#c04010', pantsColor = '#4a3020', cx = 100 }) {
  return (
    <>
      {/* Neck */}
      <path d={`M ${cx-10} 168 Q ${cx-10} 182 ${cx} 184 Q ${cx+10} 182 ${cx+10} 168`} fill={SKIN} />
      {/* Shirt */}
      <path d={`M ${cx-52} 192 Q ${cx-44} 182 ${cx-12} 180 L ${cx+12} 180 Q ${cx+44} 182 ${cx+52} 192 L ${cx+55} 250 L ${cx-55} 250 Z`} fill={shirtColor} />
      {/* Arms */}
      <path d={`M ${cx-52} 192 Q ${cx-68} 208 ${cx-66} 248 L ${cx-50} 248 Q ${cx-48} 216 ${cx-36} 200 Z`} fill={shirtColor} />
      <path d={`M ${cx+52} 192 Q ${cx+68} 208 ${cx+66} 248 L ${cx+50} 248 Q ${cx+48} 216 ${cx+36} 200 Z`} fill={shirtColor} />
      {/* Hands */}
      <ellipse cx={cx - 57} cy={252} rx="12" ry="9" fill={SKIN} />
      <ellipse cx={cx + 57} cy={252} rx="12" ry="9" fill={SKIN} />
      {/* Pants */}
      <path d={`M ${cx-52} 250 L ${cx-55} 310 L ${cx-28} 310 L ${cx} 268 L ${cx+28} 310 L ${cx+55} 310 L ${cx+52} 250 Z`} fill={pantsColor} />
      {/* Boots */}
      <ellipse cx={cx - 40} cy={315} rx="18" ry="8" fill="#3a2010" />
      <ellipse cx={cx + 40} cy={315} rx="18" ry="8" fill="#3a2010" />
    </>
  )
}

/* ─── COWBOY customer ───────────────────────────────────────────────────────── */
export function CowboyPortrait({ active, hatColor = '#8b5520', shirtColor = '#b03020' }) {
  return (
    <svg
      className={`char-svg customer-svg ${active ? 'char-active' : 'char-inactive'}`}
      viewBox="0 0 200 330"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hat shadow on head */}
      <ellipse cx="100" cy="92" rx="46" ry="12" fill="rgba(0,0,0,0.25)" />
      {/* Hat brim (wide) */}
      <ellipse cx="100" cy="86" rx="62" ry="14" fill={hatColor} />
      {/* Hat top */}
      <path d="M 70 86 Q 68 52 100 48 Q 132 52 130 86 Z" fill={hatColor} />
      {/* Hat crease */}
      <path d="M 78 68 Q 100 62 122 68" stroke="rgba(0,0,0,0.2)" strokeWidth="2" fill="none" />
      {/* Bandana */}
      <path d="M 70 182 Q 100 172 130 182 L 122 200 Q 100 196 78 200 Z" fill="#c03020" />
      {/* Head (hair) */}
      <ellipse cx="100" cy="90" rx="38" ry="16" fill="#5a3010" />

      <Face cx={100} cy={130} mustache />

      {/* Stubble shadow */}
      <ellipse cx="100" cy="155" rx="24" ry="12" fill="rgba(90,48,16,0.15)" />

      <StandingBody shirtColor={shirtColor} pantsColor="#3a2810" />
      {/* Belt */}
      <rect x="46" y="247" width="108" height="8" rx="4" fill="#5a3010" />
      <rect x="96" y="245" width="8" height="12" rx="2" fill="#c8a040" />
    </svg>
  )
}

/* ─── WOMAN customer ────────────────────────────────────────────────────────── */
export function WomanPortrait({ active }) {
  return (
    <svg
      className={`char-svg customer-svg ${active ? 'char-active' : 'char-inactive'}`}
      viewBox="0 0 200 330"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bonnet back */}
      <ellipse cx="100" cy="88" rx="50" ry="46" fill="#d4b090" />
      {/* Bonnet brim */}
      <path d="M 54 100 Q 48 78 100 68 Q 152 78 146 100 Q 130 90 100 88 Q 70 90 54 100 Z" fill="#e8c8a0" />
      {/* Bonnet ties */}
      <path d="M 60 108 Q 52 130 58 150" stroke="#d4b090" strokeWidth="5" fill="none" strokeLinecap="round" />

      <Face cx={100} cy={132} feminine />

      {/* Hair sides */}
      <ellipse cx="62" cy="120" rx="14" ry="24" fill="#5a3010" />
      <ellipse cx="138" cy="120" rx="14" ry="24" fill="#5a3010" />

      {/* Prairie dress (blue-grey) */}
      <path d="M 52 192 Q 44 182 60 178 L 80 178 L 100 182 L 120 178 L 140 178 Q 156 182 148 192 L 155 260 L 45 260 Z" fill="#8090a0" />
      {/* Apron */}
      <path d="M 76 182 L 72 258 L 128 258 L 124 182 Z" fill="#e8e0d0" />
      {/* Collar */}
      <path d="M 85 178 L 78 195" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 115 178 L 122 195" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Dress skirt flare */}
      <path d="M 45 260 Q 35 290 40 320 L 160 320 Q 165 290 155 260 Z" fill="#8090a0" />
      {/* Arms */}
      <path d="M 52 192 Q 34 208 34 248 L 54 248 Q 52 216 60 202 Z" fill="#8090a0" />
      <path d="M 148 192 Q 166 208 166 248 L 146 248 Q 148 216 140 202 Z" fill="#8090a0" />
      <ellipse cx="34" cy="252" rx="12" ry="9" fill={SKIN} />
      <ellipse cx="166" cy="252" rx="12" ry="9" fill={SKIN} />
      {/* Shoes */}
      <ellipse cx="65" cy="320" rx="20" ry="7" fill="#3a2010" />
      <ellipse cx="135" cy="320" rx="20" ry="7" fill="#3a2010" />
    </svg>
  )
}

/* ─── GENTLEMAN customer ────────────────────────────────────────────────────── */
export function GentlemanPortrait({ active, hatColor = '#2a2a2a', coatColor = '#2a3040' }) {
  return (
    <svg
      className={`char-svg customer-svg ${active ? 'char-active' : 'char-inactive'}`}
      viewBox="0 0 200 330"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top hat */}
      <ellipse cx="100" cy="86" rx="46" ry="11" fill={hatColor} />
      <rect x="66" y="42" width="68" height="46" rx="4" fill={hatColor} />
      <path d="M 66 48 Q 100 40 134 48" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
      {/* Hat band */}
      <rect x="66" y="76" width="68" height="8" rx="2" fill="#1a1a1a" />

      {/* Hair */}
      <ellipse cx="100" cy="90" rx="38" ry="14" fill="#3a2808" />

      <Face cx={100} cy={130} mustache />

      {/* Coat */}
      <path d="M 52 192 Q 42 182 56 178 L 76 178 L 100 182 L 124 178 L 144 178 Q 158 182 148 192 L 152 260 L 48 260 Z" fill={coatColor} />
      {/* Lapels */}
      <path d="M 100 182 L 84 205 L 78 195 L 100 182 Z" fill="#3a4858" />
      <path d="M 100 182 L 116 205 L 122 195 L 100 182 Z" fill="#3a4858" />
      {/* Waistcoat */}
      <path d="M 86 205 L 84 258 L 116 258 L 114 205 Z" fill="#c8b060" />
      {/* Cravat / tie */}
      <path d="M 94 182 Q 100 195 100 208 Q 100 195 106 182" fill="white" />
      {/* Pocket watch chain */}
      <path d="M 108 230 Q 120 224 124 220" stroke="#c8a040" strokeWidth="2" fill="none" />
      {/* Arms (coat) */}
      <path d="M 52 192 Q 32 208 30 252 L 54 252 Q 52 218 62 204 Z" fill={coatColor} />
      <path d="M 148 192 Q 168 208 170 252 L 146 252 Q 148 218 138 204 Z" fill={coatColor} />
      {/* White shirt cuffs */}
      <rect x="26" y="244" width="26" height="10" rx="5" fill="white" />
      <rect x="148" y="244" width="26" height="10" rx="5" fill="white" />
      <ellipse cx="30" cy="258" rx="12" ry="9" fill={SKIN} />
      <ellipse cx="170" cy="258" rx="12" ry="9" fill={SKIN} />
      {/* Trousers */}
      <path d="M 48 260 L 44 318 L 80 318 L 100 272 L 120 318 L 156 318 L 152 260 Z" fill="#2a2a3a" />
      <ellipse cx="66" cy="320" rx="18" ry="7" fill="#1a1a1a" />
      <ellipse cx="134" cy="320" rx="18" ry="7" fill="#1a1a1a" />
    </svg>
  )
}

/* ─── OFFICIAL customer (Deputy) ────────────────────────────────────────────── */
export function OfficialPortrait({ active }) {
  return (
    <svg
      className={`char-svg customer-svg ${active ? 'char-active' : 'char-inactive'}`}
      viewBox="0 0 200 330"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cowboy hat */}
      <ellipse cx="100" cy="86" rx="58" ry="13" fill="#8b8060" />
      <path d="M 72 86 Q 70 54 100 50 Q 130 54 128 86 Z" fill="#8b8060" />
      {/* Hat dent */}
      <path d="M 80 70 Q 100 66 120 70" stroke="rgba(0,0,0,0.2)" strokeWidth="2" fill="none" />
      {/* Hat band */}
      <path d="M 72 85 Q 100 78 128 85" stroke="#5a5030" strokeWidth="5" fill="none" />

      <ellipse cx="100" cy="90" rx="38" ry="14" fill="#4a3010" />
      <Face cx={100} cy={130} mustache />

      {/* Uniform shirt (tan/khaki) */}
      <path d="M 50 192 Q 42 182 56 178 L 76 178 L 100 182 L 124 178 L 144 178 Q 158 182 150 192 L 154 255 L 46 255 Z" fill="#b0a070" />
      {/* Front placket */}
      <rect x="95" y="180" width="10" height="75" rx="2" fill="#a09060" />
      {/* Shoulder patches */}
      <rect x="52" y="182" width="24" height="8" rx="3" fill="#8a8050" />
      <rect x="124" y="182" width="24" height="8" rx="3" fill="#8a8050" />
      {/* STAR BADGE */}
      <polygon points="100,200 103,210 113,210 105,216 108,226 100,220 92,226 95,216 87,210 97,210" fill="#c8c040" stroke="#a0a020" strokeWidth="1.5" />
      {/* Arms */}
      <path d="M 50 192 Q 30 208 28 252 L 52 252 Q 50 218 60 204 Z" fill="#b0a070" />
      <path d="M 150 192 Q 170 208 172 252 L 148 252 Q 150 218 140 204 Z" fill="#b0a070" />
      <ellipse cx="28" cy="257" rx="13" ry="9" fill={SKIN} />
      <ellipse cx="172" cy="257" rx="13" ry="9" fill={SKIN} />
      {/* Belt + holster */}
      <rect x="44" y="252" width="112" height="8" rx="4" fill="#5a3010" />
      <rect x="54" y="255" width="24" height="28" rx="3" fill="#3a2010" />
      {/* Pants */}
      <path d="M 46 258 L 42 318 L 78 318 L 100 270 L 122 318 L 158 318 L 154 258 Z" fill="#6a5830" />
      <ellipse cx="60" cy="320" rx="18" ry="7" fill="#3a2010" />
      <ellipse cx="140" cy="320" rx="18" ry="7" fill="#3a2010" />
    </svg>
  )
}

/* ─── ARISTOCRAT customer (Supervisor) ─────────────────────────────────────── */
export function AristocratPortrait({ active }) {
  return (
    <svg
      className={`char-svg customer-svg ${active ? 'char-active' : 'char-inactive'}`}
      viewBox="0 0 200 330"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Elaborate hat base */}
      <ellipse cx="100" cy="86" rx="52" ry="12" fill="#2a1a3a" />
      <rect x="62" y="46" width="76" height="42" rx="6" fill="#2a1a3a" />
      {/* Hat feather */}
      <path d="M 138 46 Q 160 20 170 -10 Q 158 10 148 30 Q 162 8 172 -18 Q 154 12 142 36" stroke="#c050c0" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 138 46 Q 152 30 156 10" stroke="#e080e0" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Hat ornament */}
      <ellipse cx="130" cy="62" rx="10" ry="6" fill="#c8a040" />

      <ellipse cx="100" cy="92" rx="40" ry="16" fill="#3a1a20" />
      <Face cx={100} cy={134} feminine />

      {/* Brooch necklace */}
      <circle cx="100" cy="178" r="8" fill="#c8a040" />
      <circle cx="100" cy="178" r="5" fill="#8b0060" />

      {/* Fine dress (deep purple) */}
      <path d="M 50 196 Q 38 182 54 178 L 74 176 L 100 180 L 126 176 L 146 178 Q 162 182 150 196 L 158 262 L 42 262 Z" fill="#3a0a3a" />
      {/* Dress trim / gold edging */}
      <path d="M 50 196 Q 38 182 54 178" stroke="#c8a040" strokeWidth="3" fill="none" />
      <path d="M 150 196 Q 162 182 146 178" stroke="#c8a040" strokeWidth="3" fill="none" />
      <line x1="42" y1="262" x2="158" y2="262" stroke="#c8a040" strokeWidth="3" />
      {/* Lace collar */}
      <path d="M 78 176 Q 100 190 122 176 Q 110 200 100 198 Q 90 200 78 176 Z" fill="white" opacity="0.7" />
      {/* Skirt */}
      <path d="M 42 262 Q 28 295 32 324 L 168 324 Q 172 295 158 262 Z" fill="#3a0a3a" />
      {/* Gold skirt line */}
      <path d="M 32 310 Q 100 318 168 310" stroke="#c8a040" strokeWidth="2.5" fill="none" />
      {/* Arms */}
      <path d="M 50 196 Q 28 212 26 258 L 52 258 Q 50 224 62 208 Z" fill="#3a0a3a" />
      <path d="M 150 196 Q 172 212 174 258 L 148 258 Q 150 224 138 208 Z" fill="#3a0a3a" />
      <ellipse cx="26" cy="263" rx="13" ry="9" fill={SKIN} />
      <ellipse cx="174" cy="263" rx="13" ry="9" fill={SKIN} />
      {/* Gloved fan in left hand */}
      <path d="M 14 262 Q 8 244 18 236 Q 22 248 26 262 Z" fill="#c8a040" opacity="0.8" />
    </svg>
  )
}

/* ─── MYSTERIOUS customer (prompt injector) ────────────────────────────────── */
export function MysteriousPortrait({ active }) {
  return (
    <svg
      className={`char-svg customer-svg ${active ? 'char-active' : 'char-inactive'}`}
      viewBox="0 0 200 330"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Wide dark hat */}
      <ellipse cx="100" cy="88" rx="68" ry="15" fill="#1a1a1a" />
      <path d="M 68 88 Q 64 46 100 42 Q 136 46 132 88 Z" fill="#1a1a1a" />
      {/* Hat glint */}
      <path d="M 76 64 Q 82 58 92 60" stroke="rgba(255,255,255,0.12)" strokeWidth="2" fill="none" />

      {/* Deep shadow across face */}
      <ellipse cx="100" cy="130" rx="38" ry="42" fill="#2a1a0a" />
      {/* Just hint of face in shadow */}
      <ellipse cx="100" cy="130" rx="32" ry="36" fill="#4a2a10" opacity="0.7" />
      {/* Glowing eyes */}
      <ellipse cx="86" cy="122" rx="7" ry="5" fill="#ffcc00" opacity="0.85" />
      <ellipse cx="114" cy="122" rx="7" ry="5" fill="#ffcc00" opacity="0.85" />
      <ellipse cx="86" cy="122" rx="4" ry="3" fill="#ff8800" />
      <ellipse cx="114" cy="122" rx="4" ry="3" fill="#ff8800" />
      {/* Smirk */}
      <path d="M 88 148 Q 100 153 112 148" stroke="#8b5020" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Dark coat */}
      <path d="M 50 196 Q 38 180 52 176 L 72 174 L 100 178 L 128 174 L 148 176 Q 162 180 150 196 L 156 262 L 44 262 Z" fill="#1a1a1a" />
      {/* Trench coat collar up */}
      <path d="M 100 178 L 84 202 L 78 196 L 100 178 Z" fill="#2a2a2a" />
      <path d="M 100 178 L 116 202 L 122 196 L 100 178 Z" fill="#2a2a2a" />
      {/* Gloved hands */}
      <path d="M 50 196 Q 30 214 28 258 L 52 258 Q 50 222 62 206 Z" fill="#1a1a1a" />
      <path d="M 150 196 Q 170 214 172 258 L 148 258 Q 150 222 138 206 Z" fill="#1a1a1a" />
      <ellipse cx="28" cy="263" rx="13" ry="9" fill="#2a2a2a" />
      <ellipse cx="172" cy="263" rx="13" ry="9" fill="#2a2a2a" />
      {/* Note in hand */}
      <rect x="12" y="252" width="20" height="26" rx="2" fill="#f5e8c8" transform="rotate(-10 22 265)" />
      <line x1="14" y1="260" x2="28" y2="258" stroke="#8b2020" strokeWidth="1.5" />
      <line x1="13" y1="264" x2="27" y2="262" stroke="#8b2020" strokeWidth="1.5" />
      {/* Pants */}
      <path d="M 44 262 L 40 320 L 78 320 L 100 272 L 122 320 L 160 320 L 156 262 Z" fill="#111111" />
      <ellipse cx="59" cy="322" rx="18" ry="7" fill="#0a0a0a" />
      <ellipse cx="141" cy="322" rx="18" ry="7" fill="#0a0a0a" />
    </svg>
  )
}

/* ─── Lookup by emoji ───────────────────────────────────────────────────────── */
export function getCustomerPortrait(emoji, active) {
  switch (emoji) {
    case '👩': return <WomanPortrait active={active} />
    case '🤵': return <GentlemanPortrait active={active} />
    case '🎩': return <GentlemanPortrait active={active} coatColor="#3a2a10" hatColor="#3a2a10" />
    case '⭐': return <OfficialPortrait active={active} />
    case '👤': return <CowboyPortrait active={active} hatColor="#5a4020" shirtColor="#8b4020" />
    case '👑': return <AristocratPortrait active={active} />
    case '❓': return <MysteriousPortrait active={active} />
    case '🤠':
    default:   return <CowboyPortrait active={active} />
  }
}
