// src/components/YearTabs.jsx

export default function YearTabs({ activeYear, setActiveYear }) {
  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  return (
    <div className="flex gap-3 mb-4">
      {years?.map((year, index) => (
        <button
          key={index}
          onClick={() => setActiveYear(index + 1)}
          className={`px-4 py-2 rounded-lg font-semibold border ${
            activeYear === index + 1
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          {year}
        </button>
      ))}
    </div>
  );
}
