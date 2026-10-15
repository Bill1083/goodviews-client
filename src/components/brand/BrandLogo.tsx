/**
 * The logo, in every size the app uses. The product is being renamed: the
 * letters and words come from BRAND (config/brand.ts), and swapping the logo
 * itself means editing only this file.
 */
import { BRAND } from '../../config/brand'

const FONT = '"Source Sans 3", sans-serif'

/** Film strip SVG — large (91 × 73), used for the top-left GV logo */
export function FilmStripLarge() {
  return (
    <svg width="91" height="73" viewBox="1058 -49 91 73" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g style={{ opacity: 0.6 }}>
        <path d="M1069.375,-36.833L1137.625,-36.833C1139.719,-36.833,1141.417,-35.472,1141.417,-33.792L1141.417,-30.75L1065.583,-30.75L1065.583,-33.792C1065.583,-35.472,1067.281,-36.833,1069.375,-36.833Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
      </g>
      <g style={{ opacity: 0.3 }}>
        <path d="M1076.958,-42.917L1130.042,-42.917C1132.136,-42.917,1133.833,-41.555,1133.833,-39.875L1133.833,-36.833L1073.167,-36.833L1073.167,-39.875C1073.167,-41.555,1074.864,-42.917,1076.958,-42.917Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
      </g>
      <path d="M1061.792,-30.75L1145.208,-30.75C1147.302,-30.75,1149,-29.388,1149,-27.708L1149,17.917C1149,19.597,1147.302,20.958,1145.208,20.958L1061.792,20.958C1059.698,20.958,1058,19.597,1058,17.917L1058,-27.708C1058,-29.388,1059.698,-30.75,1061.792,-30.75ZM1061.792,-24.667L1061.792,-15.542L1073.167,-15.542L1073.167,-24.667L1061.792,-24.667ZM1061.792,-9.458L1061.792,-0.333L1073.167,-0.333L1073.167,-9.458L1061.792,-9.458ZM1061.792,5.75L1061.792,14.875L1073.167,14.875L1073.167,5.75L1061.792,5.75ZM1133.833,-24.667L1133.833,-15.542L1145.208,-15.542L1145.208,-24.667L1133.833,-24.667ZM1133.833,-9.458L1133.833,-0.333L1145.208,-0.333L1145.208,-9.458L1133.833,-9.458ZM1133.833,5.75L1133.833,14.875L1145.208,14.875L1145.208,5.75L1133.833,5.75Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
    </svg>
  )
}

/** Film strip SVG — small, used between "Good" and "Views" in the panel header */
export function FilmStripSmall({ width = 44, height = 39 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="1878 -52 62 55" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g style={{ opacity: 0.6 }}>
        <path d="M1885.75,-42.833L1932.25,-42.833C1933.677,-42.833,1934.833,-41.807,1934.833,-40.542L1934.833,-38.25L1883.167,-38.25L1883.167,-40.542C1883.167,-41.807,1884.323,-42.833,1885.75,-42.833Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
      </g>
      <g style={{ opacity: 0.3 }}>
        <path d="M1890.917,-47.417L1927.083,-47.417C1928.51,-47.417,1929.667,-46.391,1929.667,-45.125L1929.667,-42.833L1888.333,-42.833L1888.333,-45.125C1888.333,-46.391,1889.49,-47.417,1890.917,-47.417Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
      </g>
      <path d="M1880.583,-38.25L1937.417,-38.25C1938.843,-38.25,1940,-37.224,1940,-35.958L1940,-1.583C1940,-0.318,1938.843,0.708,1937.417,0.708L1880.583,0.708C1879.157,0.708,1878,-0.318,1878,-1.583L1878,-35.958C1878,-37.224,1879.157,-38.25,1880.583,-38.25ZM1880.583,-33.667L1880.583,-26.792L1888.333,-26.792L1888.333,-33.667L1880.583,-33.667ZM1880.583,-22.208L1880.583,-15.333L1888.333,-15.333L1888.333,-22.208L1880.583,-22.208ZM1880.583,-10.75L1880.583,-3.875L1888.333,-3.875L1888.333,-10.75L1880.583,-10.75ZM1929.667,-33.667L1929.667,-26.792L1937.417,-26.792L1937.417,-33.667L1929.667,-33.667ZM1929.667,-22.208L1929.667,-15.333L1937.417,-15.333L1937.417,-22.208L1929.667,-22.208ZM1929.667,-10.75L1929.667,-3.875L1937.417,-3.875L1937.417,-10.75L1929.667,-10.75Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
    </svg>
  )
}

export function NavLogo() {
  return (
    <div className="flex items-center" style={{ gap: 4 }}>
      <span
        className="font-normal text-gray-lighter leading-none select-none text-[28px] md:text-[42px]"
        style={{ fontFamily: '"Source Sans 3", sans-serif' }}
      >{BRAND.monogram[0]}</span>
      <svg className="w-[34px] h-[26px] md:w-[51px] md:h-[39px]" viewBox="1049 894 51 39" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g style={{ opacity: 0.6 }}>
          <path d="M1055.375,900.5L1093.625,900.5C1094.798583984375,900.5,1095.75,901.2275390625,1095.75,902.125L1095.75,903.75L1053.2501220703125,903.75L1053.2501220703125,902.125C1053.2501220703125,901.2275390625,1054.2015380859375,900.5,1055.375,900.5Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
        </g>
        <g style={{ opacity: 0.3 }}>
          <path d="M1059.625,897.25L1089.375,897.25C1090.548583984375,897.25,1091.5,897.9775390625,1091.5,898.875L1091.5,900.5L1057.5,900.5L1057.5,898.875C1057.5,897.9775390625,1058.451416015625,897.25,1059.625,897.25Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
        </g>
        <path d="M1051.1251220703125,903.75L1097.875,903.75C1099.0484619140625,903.75,1100,904.4775390625,1100,905.375L1100,929.75C1100,930.6474609375,1099.0484619140625,931.375,1097.875,931.375L1051.1251220703125,931.375C1049.9515380859375,931.375,1049,930.6474609375,1049,929.75L1049,905.375C1049,904.4775390625,1049.9515380859375,903.75,1051.1251220703125,903.75ZM1051.1251220703125,907L1051.1251220703125,911.875L1057.5,911.875L1057.5,907L1051.1251220703125,907ZM1051.1251220703125,915.125L1051.1251220703125,920L1057.5,920L1057.5,915.125L1051.1251220703125,915.125ZM1051.1251220703125,923.25L1051.1251220703125,928.125L1057.5,928.125L1057.5,923.25L1051.1251220703125,923.25ZM1091.5,907L1091.5,911.875L1097.875,911.875L1097.875,907L1091.5,907ZM1091.5,915.125L1091.5,920L1097.875,920L1097.875,915.125L1091.5,915.125ZM1091.5,923.25L1091.5,928.125L1097.875,928.125L1097.875,923.25L1091.5,923.25Z" fillRule="evenodd" clipRule="evenodd" fill="white" />
      </svg>
      <span
        className="font-normal text-gray-lighter leading-none select-none text-[28px] md:text-[42px]"
        style={{ fontFamily: '"Source Sans 3", sans-serif' }}
      >{BRAND.monogram[1]}</span>
    </div>
  )
}

/** "Good [film strip] Views" — the panel heading on the sign-in page. */
export function BrandWordmark({ className = '', size = 34 }: { className?: string; size?: number }) {
  const scale = size / 34
  return (
    <div className={`flex items-center justify-center gap-[9px] ${className}`} role="img" aria-label={BRAND.name}>
      <span aria-hidden className="font-normal leading-none text-white" style={{ fontSize: size, fontFamily: FONT }}>{BRAND.wordmark.before}</span>
      <FilmStripSmall width={Math.round(50 * scale)} height={Math.round(44 * scale)} />
      <span aria-hidden className="font-normal leading-none text-white" style={{ fontSize: size, fontFamily: FONT }}>{BRAND.wordmark.after}</span>
    </div>
  )
}

/** The two monogram letters inside the large film strip (sign-in page, top left). */
export function BrandMonogram() {
  const letter = { fontSize: 45, fontFamily: FONT, fontWeight: 400, color: '#200a32', lineHeight: 1 } as const
  return (
    <div className="relative" style={{ width: 91, height: 73 }} role="img" aria-label={BRAND.name}>
      <FilmStripLarge />
      <span aria-hidden className="absolute pointer-events-none select-none" style={{ left: 18, top: 17, ...letter }}>{BRAND.monogram[0]}</span>
      <span aria-hidden className="absolute pointer-events-none select-none" style={{ left: 43, top: 27, ...letter }}>{BRAND.monogram[1]}</span>
    </div>
  )
}
