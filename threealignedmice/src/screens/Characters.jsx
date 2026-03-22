import maleOutlaw       from '../assets/male_outlaw.png'
import maleSaloonKeeper  from '../assets/male_saloon_keeper.png'
import maleSheriff       from '../assets/male_sheriff.png'
import womanDeputy       from '../assets/woman_deputy.png'
import womanSaloonSinger from '../assets/woman_saloon_singer.png'

// Each named character gets a fixed portrait
const NAME_PORTRAIT = {
  // ── Adversarial ──────────────────────────────────────────────────────────
  'Bill Crawford':               maleOutlaw,
  'Deputy Frank Holloway':       maleSheriff,
  'Hector Vane':                 maleOutlaw,
  'Reverend Silas Moon':         maleSaloonKeeper,
  'Randolph Sikes':              maleOutlaw,
  'Dolores Finch':               womanSaloonSinger,
  'Clarence Mott':               maleSaloonKeeper,
  'Rosa Tillman':                womanSaloonSinger,
  'Nelly Croft':                 womanSaloonSinger,

  'Sheriff Weston Cray':         maleSheriff,
  'Attorney Lucius Pemberton':   maleSaloonKeeper,
  'Reginald Voss':               maleOutlaw,
  'Federal Agent Harlan Cross':  maleSheriff,
  'Miriam Holloway':             womanDeputy,
  'Cecil Durant':                maleSaloonKeeper,
  'Nora Standish':               womanSaloonSinger,
  'Inspector Thaddeus Brill':    maleSheriff,
  'Colonel Jasper Reid':         maleSheriff,
  'Edna Marsh':                  womanSaloonSinger,

  'Violet Ashby':                womanDeputy,
  'Cornelius Blackwood':         maleSaloonKeeper,
  'Rosalind Dray':               womanSaloonSinger,
  'Amos Greer':                  maleOutlaw,
  'Delphine Voss':               womanDeputy,
  'Fletcher Mane':               maleOutlaw,
  'Percival Haze':               maleSaloonKeeper,

  'Zara Holbrook':               womanDeputy,
  'Harlan Vance':                maleOutlaw,
  'Customer C (Synthesis)':      maleOutlaw,
  'Ignatius Fell':               maleSaloonKeeper,
  'Seraphina Cross':             womanDeputy,
  'Plant Customer (Tier 4 Setup)': maleSaloonKeeper,

  // ── Legitimate account holders ───────────────────────────────────────────
  'Eleanor Whitfield':           womanSaloonSinger,
  'James Harrington':            maleSaloonKeeper,
  'Margaret Calloway':           womanDeputy,
  'Thomas Duval':                maleSaloonKeeper,
  'Clara Beaumont':              womanSaloonSinger,
  'Samuel Reedwood':             maleOutlaw,
  'Harriet Fontaine':            womanSaloonSinger,
  'Ezekiel Morrow':              maleSaloonKeeper,
  'Josephine Crane':             womanSaloonSinger,
  'Wallace Tremblay':            maleOutlaw,
}

export function getCustomerPortrait(name, gender, active) {
  const src = NAME_PORTRAIT[name] ?? (gender === 'female' ? womanSaloonSinger : maleOutlaw)
  return (
    <img
      src={src}
      className={`char-svg ${active ? 'char-active' : 'char-inactive'}`}
      alt=""
    />
  )
}
