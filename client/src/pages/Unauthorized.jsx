import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Access Denied
        </h1>
        <p className="mt-2 text-gray-600">
          You do not have permission to access this page.
        </p>

        <Link
          to="/dashboard"
          className="inline-block mt-4 text-blue-600 hover:underline"
        >
          Go back to Dashboard
        </Link>
      </div>
    </div>
  );
}
