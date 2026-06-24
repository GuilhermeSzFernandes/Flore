import PatientCombobox from "@/components/PatientCombobox"

const patients = [
  { id: "1", name: "Maria Helena Costa", phone: "11988881234" },
  { id: "2", name: "Ana Carolina Souza", phone: "11977770000" },
  { id: "3", name: "Renata Silva", phone: "11966665555" },
]

export function Seletor() {
  return (
    <div style={{ width: 320 }}>
      <PatientCombobox patients={patients} />
    </div>
  )
}
