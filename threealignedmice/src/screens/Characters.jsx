import maleOutlaw       from '../assets/male_outlaw.png'
import maleSaloonKeeper  from '../assets/male_saloon_keeper.png'
import maleSheriff       from '../assets/male_sheriff.png'
import womanDeputy       from '../assets/woman_deputy.png'
import womanSaloonSinger from '../assets/woman_saloon_singer.png'

const EMOJI_MAP = {
  '🤠': maleOutlaw,
  '👩': womanSaloonSinger,
  '🤵': maleSaloonKeeper,
  '⭐': maleSheriff,
  '🎩': maleSaloonKeeper,
  '👤': womanDeputy,
  '👑': womanSaloonSinger,
  '❓': maleOutlaw,
}

export function getCustomerPortrait(emoji, active) {
  const src = EMOJI_MAP[emoji] || maleOutlaw
  return (
    <img
      src={src}
      className={`char-svg ${active ? 'char-active' : 'char-inactive'}`}
      alt=""
    />
  )
}
