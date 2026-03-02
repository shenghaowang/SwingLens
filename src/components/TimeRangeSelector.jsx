const RANGES = ['1M', '3M', '6M', '1Y', '3Y', '5Y']

export default function TimeRangeSelector({ selected, onChange }) {
  return (
    <div className="flex gap-1">
      {RANGES.map(r => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            selected === r
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  )
}
