import Link from 'next/link'

export default function Logo() {
  return (
    <Link href="/" className="font-bold text-base shrink-0">
      <span style={{ color: '#FFBE00' }}>torch.</span><span className="text-white">EDC.wiki</span>
    </Link>
  )
}
