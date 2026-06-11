// src/components/SectionTabs.jsx

export default function SectionTabs({ activeSection, setActiveSection, availableSections = ["A"] }) {
  const sections = availableSections;

  return (
    <div className="flex gap-3 mb-4">
      {sections?.map((sec) => (
        <button
          key={sec}
          onClick={() => setActiveSection(sec)}
          className={`px-4 py-2 rounded-lg font-semibold border ${
            activeSection === sec
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          Section {sec}
        </button>
      ))}
    </div>
  );
}
