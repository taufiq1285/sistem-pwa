import { AuthProvider } from '@/providers/AuthProvider';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <h1 className="text-3xl font-bold text-center py-8">
          Sistem Praktikum Kebidanan
        </h1>
        {/* Routes will go here */}
      </div>
    </AuthProvider>
  );
}

export default App;