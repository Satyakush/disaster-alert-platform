const severityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function AlertCard({ alert }) {
  const {
    title,
    description,
    disasterType,
    severity,
    location,
    createdBy,
    createdAt,
  } = alert;

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-800">
          {title}
        </h3>

        <span
          className={`text-xs px-2 py-1 rounded font-medium ${
            severityColors[severity] || "bg-gray-100 text-gray-800"
          }`}
        >
          {severity?.toUpperCase()}
        </span>
      </div>

      <p className="text-gray-600 mt-2">{description}</p>

      <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-500">
        <div>
          <strong>Type:</strong> {disasterType}
        </div>
        <div>
          <strong>Location:</strong> {location}
        </div>
        <div>
          <strong>Created by:</strong> {createdBy?.name}
        </div>
        <div>
          <strong>Time:</strong>{" "}
          {new Date(createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
